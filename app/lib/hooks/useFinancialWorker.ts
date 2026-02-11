import { useState, useEffect, useCallback, useRef } from 'react';

interface WorkerMessage {
  type: string;
  data: any;
  id: string;
}

interface WorkerResponse {
  type: string;
  result: any;
  error?: string;
  id: string;
}

export function useFinancialWorker() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRequests = useRef<Map<string, (result: any) => void>>(new Map());
  
  // Initialize the worker
  useEffect(() => {
    // Check if Web Workers are supported
    if (typeof window === 'undefined' || !window.Worker) {
      console.warn('Web Workers not supported in this environment');
      return;
    }

    try {
      // Create worker from the worker file
      const financialWorker = new Worker(new URL('../workers/financialWorker.ts', import.meta.url));
      setWorker(financialWorker);
      
      // Set up message handler
      financialWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const response = e.data;
        
        // Find the callback for this request
        const callback = pendingRequests.current.get(response.id);
        if (callback) {
          if (response.error) {
            console.error('Worker error:', response.error);
            setError(response.error);
          } else {
            callback(response.result);
          }
          pendingRequests.current.delete(response.id);
        }
        
        setIsLoading(false);
      };
      
      financialWorker.onerror = (e) => {
        console.error('Worker error:', e);
        setError('WebWorker error: ' + e.message);
        setIsLoading(false);
      };
      
      return () => {
        financialWorker.terminate();
      };
    } catch (e) {
      console.error('Failed to create worker:', e);
      setError('Failed to initialize WebWorker');
    }
  }, []);

  // Send a message to the worker
  const sendWorkerMessage = useCallback((
    type: string,
    data: any,
    timeout: number = 30000
  ): Promise<any> => {
    if (!worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }
    
    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      // Store the callback
      pendingRequests.current.set(requestId, resolve);
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        pendingRequests.current.delete(requestId);
        setIsLoading(false);
        reject(new Error('Worker request timed out'));
      }, timeout);
      
      // Send the message
      const message: WorkerMessage = {
        type,
        data,
        id: requestId,
      };
      
      try {
        worker.postMessage(message);
        setIsLoading(true);
        setError(null);
      } catch (e) {
        clearTimeout(timeoutId);
        pendingRequests.current.delete(requestId);
        setIsLoading(false);
        reject(e);
      }
    });
  }, [worker]);

  // Run Monte Carlo simulation
  const runMonteCarloSimulation = useCallback((
    goal: any,
    currentNetWorth: number,
    params: { numSimulations: number; volatility: number }
  ) => {
    return sendWorkerMessage('monte-carlo', { goal, currentNetWorth, params });
  }, [sendWorkerMessage]);

  // Run scenario analysis
  const runScenarioAnalysis = useCallback((
    goal: any,
    currentNetWorth: number,
    scenarios: any[]
  ) => {
    return sendWorkerMessage('scenario-analysis', { goal, currentNetWorth, scenarios });
  }, [sendWorkerMessage]);

  // Perform time-based analysis
  const performTimeBasedAnalysis = useCallback((projectionData: any[]) => {
    return sendWorkerMessage('time-based-analysis', { projectionData });
  }, [sendWorkerMessage]);

  // Generate projection data
  const generateProjectionData = useCallback((goal: any, currentNetWorth: number) => {
    return sendWorkerMessage('projection-data', { goal, currentNetWorth });
  }, [sendWorkerMessage]);

  // Fallback to main thread calculations if worker fails
  const withFallback = useCallback((
    workerFn: () => Promise<any>,
    fallbackFn: () => any
  ): Promise<any> => {
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