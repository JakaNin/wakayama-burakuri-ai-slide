import { kv } from '@vercel/kv';
import { Question, AnalysisResult } from './types';

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
