export interface Question {
  id: string;
  content: string;
  timestamp: number;
  category?: string;
}

export interface PickedQuestion {
  question: Question;
  importance: 'high' | 'medium';
  reason: string;
  expertAnswer: string;
}

export interface AnalysisResult {
  summary: string;
  keyInsights: string[];
  pickedQuestions: PickedQuestion[];
  analyzedAt: number;
}

// Legacy types (kept for compatibility)
export interface CategoryResult {
  name: string;
  questions: Question[];
  insight: string;
}
