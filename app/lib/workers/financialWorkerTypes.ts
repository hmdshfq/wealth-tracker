import {
  Goal,
  ProjectionDataPoint,
  MonteCarloSimulationResult,
  InvestmentScenario,
  ScenarioAnalysisResult,
  TimeBasedAnalysisResult,
} from '@/lib/types';

export interface FinancialWorkerMonteCarloParams {
  numSimulations: number;
  volatility: number;
}

export type FinancialWorkerRequestType =
  | 'monte-carlo'
  | 'scenario-analysis'
  | 'time-based-analysis'
  | 'projection-data';

export interface FinancialWorkerRequestPayloadMap {
  'monte-carlo': {
    goal: Goal;
    currentNetWorth: number;
    params: FinancialWorkerMonteCarloParams;
  };
  'scenario-analysis': {
    goal: Goal;
    currentNetWorth: number;
    scenarios: InvestmentScenario[];
  };
  'time-based-analysis': {
    projectionData: ProjectionDataPoint[];
  };
  'projection-data': {
    goal: Goal;
    currentNetWorth: number;
  };
}

export type FinancialWorkerResponsePayloadMap = {
  'monte-carlo': MonteCarloSimulationResult;
  'scenario-analysis': ScenarioAnalysisResult;
  'time-based-analysis': TimeBasedAnalysisResult;
  'projection-data': ProjectionDataPoint[];
};

export type FinancialWorkerResponsePayload =
  FinancialWorkerResponsePayloadMap[keyof FinancialWorkerResponsePayloadMap];

export interface FinancialWorkerMessage<T extends FinancialWorkerRequestType = FinancialWorkerRequestType> {
  type: T;
  data: FinancialWorkerRequestPayloadMap[T];
  id: string;
}

export interface FinancialWorkerResponse<T extends FinancialWorkerRequestType = FinancialWorkerRequestType> {
  type: T;
  result?: FinancialWorkerResponsePayloadMap[T];
  error?: string;
  id: string;
}
