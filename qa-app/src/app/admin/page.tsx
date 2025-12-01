'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question, AnalysisResult } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
  '技術的質問': 'bg-blue-100 text-blue-800',
  '意見・感想': 'bg-green-100 text-green-800',
  '要望・提案': 'bg-purple-100 text-purple-800',
  'その他': 'bg-gray-100 text-gray-800',
};

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setError('質問の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 5000);
    return () => clearInterval(interval);
  }, [fetchQuestions]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('全ての質問と分析結果を削除しますか？')) return;

    try {
      await fetch('/api/questions', { method: 'DELETE' });
      setQuestions([]);
      setAnalysis(null);
    } catch {
      setError('削除に失敗しました');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            管理者ダッシュボード
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || questions.length === 0}
            >
              {isAnalyzing ? '分析中...' : '🤖 AI分析を実行'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={questions.length === 0}
            >
              クリア
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 受信した質問
              <Badge variant="secondary">{questions.length}件</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                まだ質問がありません
              </p>
            ) : (
              <ul className="space-y-3">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className="p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <p className="text-gray-900">{q.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(q.timestamp)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 AI分析結果
                <span className="text-sm font-normal text-gray-500">
                  {formatTime(analysis.analyzedAt)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📊 要約</h3>
                <p className="text-gray-900 bg-blue-50 p-4 rounded-lg">
                  {analysis.summary}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">📂 カテゴリ分類</h3>
                <div className="space-y-4">
                  {analysis.categories.map((cat, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={
                            CATEGORY_COLORS[cat.name] || CATEGORY_COLORS['その他']
                          }
                        >
                          {cat.name}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {cat.questions.length}件
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{cat.insight}</p>
                      <ul className="space-y-2">
                        {cat.questions.map((q) => (
                          <li
                            key={q.id}
                            className="text-sm text-gray-700 pl-3 border-l-2 border-gray-200"
                          >
                            {q.content}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
