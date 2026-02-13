export interface ThoughtLayer {
  id: number;
  title: string;
  description: string;
  insight: string;
}

export interface ThoughtAnalysis {
  id: string;
  originalThought: string;
  layers: ThoughtLayer[];
  rootCause: string;
  createdAt: string;
  isAnalyzing?: boolean;
}

export interface AnalysisState {
  currentStep: number;
  isComplete: boolean;
}
