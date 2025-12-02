import { kv } from '@vercel/kv';
import { Question, AnalysisResult, SurveyResponse, SurveyAnalysis } from './types';

const QUESTIONS_KEY = 'burakuri:questions';
const ANALYSIS_KEY = 'burakuri:analysis';

export async function getQuestions(): Promise<Question[]> {
  const questions = await kv.get<Question[]>(QUESTIONS_KEY);
  return questions || [];
}

export async function addQuestion(question: Question): Promise<void> {
  const questions = await getQuestions();
  questions.push(question);
  await kv.set(QUESTIONS_KEY, questions);
}

export async function clearQuestions(): Promise<void> {
  await kv.del(QUESTIONS_KEY);
  await kv.del(ANALYSIS_KEY);
}

export async function getAnalysis(): Promise<AnalysisResult | null> {
  return await kv.get<AnalysisResult>(ANALYSIS_KEY);
}

export async function saveAnalysis(analysis: AnalysisResult): Promise<void> {
  await kv.set(ANALYSIS_KEY, analysis);
}

// ============================================
// Survey Functions (事前アンケート)
// ============================================

const SURVEY_KEY = 'burakuri:survey';
const SURVEY_ANALYSIS_KEY = 'burakuri:survey:analysis';

export async function getSurveyResponses(): Promise<SurveyResponse[]> {
  const responses = await kv.get<SurveyResponse[]>(SURVEY_KEY);
  return responses || [];
}

export async function addSurveyResponse(response: SurveyResponse): Promise<void> {
  const responses = await getSurveyResponses();
  responses.push(response);
  await kv.set(SURVEY_KEY, responses);
}

export async function clearSurveyResponses(): Promise<void> {
  await kv.del(SURVEY_KEY);
  await kv.del(SURVEY_ANALYSIS_KEY);
}

export async function getSurveyAnalysis(): Promise<SurveyAnalysis | null> {
  return await kv.get<SurveyAnalysis>(SURVEY_ANALYSIS_KEY);
}

export async function saveSurveyAnalysis(analysis: SurveyAnalysis): Promise<void> {
  await kv.set(SURVEY_ANALYSIS_KEY, analysis);
}
