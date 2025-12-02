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

// ============================================
// Survey Types (事前アンケート)
// ============================================

export interface SurveyResponse {
  id: string;
  timestamp: number;
  industry: string;        // 業種
  position: string;        // 立場
  challenges: string[];    // 課題（複数選択）
  question: string;        // 聞きたいこと（自由記述）
  aiInterest: string;      // AIへの関心度
}

export interface RepresentativeQuestion {
  question: string;        // 代表質問（AIが生成）
  category: string;        // カテゴリ
  basedOn: string;         // 元になった回答の傾向
  expertAnswer: string;    // 専門家回答
}

export interface SurveyAnalysis {
  // 参加者プロファイル
  profileSummary: {
    totalResponses: number;
    industryDistribution: { name: string; count: number }[];
    positionDistribution: { name: string; count: number }[];
    aiInterestDistribution: { name: string; count: number }[];
  };
  // 地域課題の分析
  challengeAnalysis: {
    ranking: { challenge: string; count: number; percentage: number }[];
    insights: string[];
  };
  // 代表質問と専門家回答
  representativeQuestions: RepresentativeQuestion[];
  // 登壇者へのフィードバック
  speakerFeedback: {
    speaker: string;
    suggestions: string[];
  }[];
  // 分析日時
  analyzedAt: number;
}
