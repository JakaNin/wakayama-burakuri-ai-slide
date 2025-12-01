export interface Question {
  id: string;
  content: string;
  timestamp: number;
  category?: string;
}

export interface CategoryResult {
  name: string;
  questions: Question[];
  insight: string;
}

export interface AnalysisResult {
  summary: string;
  categories: CategoryResult[];
  analyzedAt: number;
}
