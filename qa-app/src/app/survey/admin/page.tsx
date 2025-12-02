'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SurveyResponse, SurveyAnalysis } from '@/lib/types';

export default function SurveyAdminPage() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [analysis, setAnalysis] = useState<SurveyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch('/api/survey');
      const data = await res.json();
      setResponses(data.responses || []);
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      const res = await fetch('/api/survey/analyze', { method: 'POST' });
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
    if (!confirm('全ての回答と分析結果を削除しますか？')) return;

    try {
      await fetch('/api/survey', { method: 'DELETE' });
      setResponses([]);
      setAnalysis(null);
    } catch {
      setError('削除に失敗しました');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            事前アンケート管理
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || responses.length === 0}
            >
              {isAnalyzing ? '分析中...' : '🤖 AI分析を実行'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={responses.length === 0}
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

        {/* 回答一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 回答一覧
              <Badge variant="secondary">{responses.length}件</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                まだ回答がありません
              </p>
            ) : (
              <div className="space-y-3">
                {responses.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">{r.ageGroup}</Badge>
                      <Badge variant="outline">{r.industryOther || r.industry}</Badge>
                      <Badge variant="outline">{r.position}</Badge>
                      <Badge variant="secondary">{r.aiInterest}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {r.challenges.map((ch) => (
                        <span
                          key={ch}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                    {r.question && (
                      <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded">
                        💬 {r.question}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatTime(r.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分析結果 */}
        {analysis && (
          <>
            {/* 開会用サマリー */}
            {analysis.openingSummary && (
              <Card className="border-2 border-yellow-300 bg-yellow-50">
                <CardHeader>
                  <CardTitle>🎤 開会用サマリー（そのまま読めます）</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-900 leading-relaxed">
                    {analysis.openingSummary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 参加者プロファイル */}
            <Card>
              <CardHeader>
                <CardTitle>📊 参加者プロファイル</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 年代分布 */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">年代</h4>
                    <ul className="space-y-1">
                      {analysis.profileSummary.ageDistribution.map((d) => (
                        <li
                          key={d.name}
                          className="flex justify-between text-sm"
                        >
                          <span>{d.name}</span>
                          <span className="text-gray-500">{d.count}名</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* 業種分布 */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">業種</h4>
                    <ul className="space-y-1">
                      {analysis.profileSummary.industryDistribution.slice(0, 5).map((d) => (
                        <li
                          key={d.name}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate">{d.name}</span>
                          <span className="text-gray-500">{d.count}名</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* 立場分布 */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">立場</h4>
                    <ul className="space-y-1">
                      {analysis.profileSummary.positionDistribution.map((d) => (
                        <li
                          key={d.name}
                          className="flex justify-between text-sm"
                        >
                          <span>{d.name}</span>
                          <span className="text-gray-500">{d.count}名</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* AI関心度分布 */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      AI関心度
                    </h4>
                    <ul className="space-y-1">
                      {analysis.profileSummary.aiInterestDistribution.map(
                        (d) => (
                          <li
                            key={d.name}
                            className="flex justify-between text-sm"
                          >
                            <span className="truncate">{d.name}</span>
                            <span className="text-gray-500">{d.count}名</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 課題分析 */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 地域課題の分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    課題ランキング
                  </h4>
                  <div className="space-y-2">
                    {analysis.challengeAnalysis.ranking.map((r, i) => (
                      <div
                        key={r.challenge}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            i === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : i === 1
                                ? 'bg-gray-100 text-gray-700'
                                : i === 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-50 text-gray-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{r.challenge}</span>
                            <span className="text-gray-500">
                              {r.count}名 ({r.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${r.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {analysis.challengeAnalysis.insights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      💡 インサイト
                    </h4>
                    <ul className="space-y-2">
                      {analysis.challengeAnalysis.insights.map((insight, i) => (
                        <li
                          key={i}
                          className="bg-yellow-50 p-3 rounded-lg text-gray-700"
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* クロス分析：興味深い発見 */}
            {analysis.crossAnalysis.interestingFindings.length > 0 && (
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle>🔍 興味深い発見（クロス分析）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.crossAnalysis.interestingFindings.map((finding, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 bg-purple-50 p-4 rounded-lg"
                      >
                        <span className="text-purple-600 font-bold text-lg">
                          {i + 1}.
                        </span>
                        <span className="text-gray-800">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 印象的なコメント */}
            {analysis.notableComments && analysis.notableComments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>💬 印象的なコメント（生の声）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.notableComments.map((comment, i) => (
                      <li
                        key={i}
                        className="bg-gray-50 p-3 rounded-lg text-gray-700 italic"
                      >
                        「{comment}」
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 代表質問と専門家回答 */}
            {analysis.representativeQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>❓ 代表質問と専門家回答</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {analysis.representativeQuestions.map((rq, i) => (
                    <div
                      key={i}
                      className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50/30"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-blue-100 text-blue-800">
                          {rq.category}
                        </Badge>
                        <span className="text-xs text-gray-500">Q{i + 1}</span>
                      </div>

                      <div className="mb-4">
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          「{rq.question}」
                        </p>
                        <p className="text-sm text-gray-500">
                          根拠：{rq.basedOn}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🧑‍💼</span>
                          <span className="font-semibold text-blue-800">
                            専門家の回答
                          </span>
                        </div>
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {rq.expertAnswer}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-gray-500 text-center">
              分析日時: {formatTime(analysis.analyzedAt)}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
