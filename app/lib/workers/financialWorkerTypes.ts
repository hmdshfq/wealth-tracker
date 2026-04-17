import {
  Goal,
  ProjectionDataPoint,
  InvestmentScenario,
  ScenarioAnalysisResult,
  TimeBasedAnalysisResult,
} from '@/lib/types';

export type FinancialWorkerRequestType =
  | 'scenario-analysis'
  | 'time-based-analysis'
  | 'projection-data';

export interface FinancialWorkerRequestPayloadMap {
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