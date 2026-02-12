import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FinancialWorkerMessage,
  FinancialWorkerResponse,
  FinancialWorkerRequestType,
  FinancialWorkerRequestPayloadMap,
  FinancialWorkerResponsePayload,
  FinancialWorkerResponsePayloadMap,
} from '@/app/lib/workers/financialWorkerTypes';

type PendingRequestCallback = (result: FinancialWorkerResponsePayload) => void;
type MonteCarloPayload = FinancialWorkerRequestPayloadMap['monte-carlo'];
type ScenarioPayload = FinancialWorkerRequestPayloadMap['scenario-analysis'];
type TimeBasedPayload = FinancialWorkerRequestPayloadMap['time-based-analysis'];
type ProjectionPayload = FinancialWorkerRequestPayloadMap['projection-data'];

export function useFinancialWorker() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequestCallback>>(new Map());

  const createWorkerInstance = (): { worker: Worker | null; error: string | null } => {
    if (typeof window === 'undefined') {
      return { worker: null, error: null };
    }

    if (!window.Worker) {
      console.warn('Web Workers not supported in this environment');
      return { worker: null, error: 'Web Workers not supported in this environment' };
    }

    try {
      return { worker: new Worker(new URL('../workers/financialWorker.ts', import.meta.url)), error: null };
    } catch (creationError) {
      console.error('Failed to create worker:', creationError);
      return { worker: null, error: 'Failed to initialize WebWorker' };
    }
  };

  const initializationResult = useMemo(() => createWorkerInstance(), []);
  const [worker] = useState<Worker | null>(() => initializationResult.worker);
  const initializationErrorRef = useRef<string | null>(initializationResult.error);

  useEffect(() => {
    if (initializationErrorRef.current) {
      setError(initializationErrorRef.current);
      initializationErrorRef.current = null;
    }

    if (!worker) {
      return;
    }

    const handleMessage = (e: MessageEvent<FinancialWorkerResponse>) => {
      const response = e.data;

      const callback = pendingRequests.current.get(response.id);
      if (callback) {
        if (response.error) {
          console.error('Worker error:', response.error);
          setError(response.error);
        } else {
          callback(response.result as FinancialWorkerResponsePayload);
        }
        pendingRequests.current.delete(response.id);
      }

      setIsLoading(false);
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Worker error:', event);
      setError('WebWorker error: ' + event.message);
      setIsLoading(false);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.terminate();
    };
  }, [worker]);

  // Send a message to the worker
  const sendWorkerMessage = useCallback(<T extends FinancialWorkerRequestType>(
    type: T,
    data: FinancialWorkerRequestPayloadMap[T],
    timeout: number = 30000
  ): Promise<FinancialWorkerResponsePayloadMap[T]> => {
    if (!worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);

      const callback: PendingRequestCallback = (result) => {
        resolve(result as FinancialWorkerResponsePayloadMap[T]);
      };

      // Store the callback
      pendingRequests.current.set(requestId, callback);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        pendingRequests.current.delete(requestId);
        setIsLoading(false);
        reject(new Error('Worker request timed out'));
      }, timeout);

      // Send the message
      const message: FinancialWorkerMessage<T> = {
        type,
        data,
        id: requestId,
      };

      try {
        worker.postMessage(message);
        setIsLoading(true);
        setError(null);
      } catch (postError) {
        clearTimeout(timeoutId);
        pendingRequests.current.delete(requestId);
        setIsLoading(false);
        reject(postError);
      }
    });
  }, [worker]);

  // Run Monte Carlo simulation
  const runMonteCarloSimulation = useCallback((
    goal: MonteCarloPayload['goal'],
    currentNetWorth: MonteCarloPayload['currentNetWorth'],
    params: MonteCarloPayload['params']
  ) => {
    return sendWorkerMessage('monte-carlo', { goal, currentNetWorth, params });
  }, [sendWorkerMessage]);

  // Run scenario analysis
  const runScenarioAnalysis = useCallback((
    goal: ScenarioPayload['goal'],
    currentNetWorth: ScenarioPayload['currentNetWorth'],
    scenarios: ScenarioPayload['scenarios']
  ) => {
    return sendWorkerMessage('scenario-analysis', { goal, currentNetWorth, scenarios });
  }, [sendWorkerMessage]);

  // Perform time-based analysis
  const performTimeBasedAnalysis = useCallback((projectionData: TimeBasedPayload['projectionData']) => {
    return sendWorkerMessage('time-based-analysis', { projectionData });
  }, [sendWorkerMessage]);

  // Generate projection data
  const generateProjectionData = useCallback((goal: ProjectionPayload['goal'], currentNetWorth: ProjectionPayload['currentNetWorth']) => {
    return sendWorkerMessage('projection-data', { goal, currentNetWorth });
  }, [sendWorkerMessage]);

  // Fallback to main thread calculations if worker fails
  const withFallback = useCallback(<T>(
    workerFn: () => Promise<T>,
    fallbackFn: () => T
  ): Promise<T> => {
    if (!worker || error) {
      console.warn('Using fallback calculation on main thread');
      return Promise.resolve(fallbackFn());
    }
    
    return workerFn().catch((e) => {
      console.warn('Worker failed, falling back to main thread:', e);
      return fallbackFn();
    });
  }, [worker, error]);

  return {
    worker,
    isLoading,
    error,
    sendWorkerMessage,
    runMonteCarloSimulation,
    runScenarioAnalysis,
    performTimeBasedAnalysis,
    generateProjectionData,
    withFallback,
  };
}

export default useFinancialWorker;
