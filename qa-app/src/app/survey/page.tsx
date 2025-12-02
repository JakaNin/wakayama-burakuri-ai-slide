'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const INDUSTRIES = [
  '観光・宿泊・飲食',
  '農業・水産・食品加工',
  '製造業',
  '小売・卸売・サービス',
  '建設・不動産',
  '金融・保険・士業',
  '行政・公務員・NPO',
  'その他',
];

const POSITIONS = [
  '経営者・代表',
  '役員・幹部',
  '管理職',
  '一般社員',
  '個人事業主・フリーランス',
  'その他',
];

const CHALLENGES = [
  '人手不足・担い手不足',
  '後継者問題',
  '集客・認知度向上',
  '業務効率化・生産性向上',
  '情報発信・マーケティング',
  '外国人観光客への対応',
  'コスト削減',
  '新規事業・新商品開発',
  '地域コミュニティの維持・活性化',
  '技術・ノウハウの継承',
];

const AI_INTERESTS = [
  '興味はあるがよくわからない',
  '期待している',
  '少し不安がある',
  'すでに活用している',
];

export default function SurveyPage() {
  const [industry, setIndustry] = useState('');
  const [position, setPosition] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [aiInterest, setAiInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const toggleChallenge = (challenge: string) => {
    setChallenges((prev) =>
      prev.includes(challenge)
        ? prev.filter((c) => c !== challenge)
        : [...prev, challenge]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!industry || !position || challenges.length === 0 || !aiInterest) {
      setError('必須項目を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          position,
          challenges,
          question: question.trim(),
          aiInterest,
        }),
      });

      if (!res.ok) {
        throw new Error('送信に失敗しました');
      }

      setSubmitted(true);
    } catch {
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-8 pb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              ご回答ありがとうございました！
            </h2>
            <p className="text-gray-600">
              いただいた内容はイベント当日に活用させていただきます。
              <br />
              当日のご参加をお待ちしております。
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900">
              AIぶらくり会 事前アンケート
            </CardTitle>
            <CardDescription className="text-base">
              イベントをより良くするため、ご協力をお願いします
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Q1: 業種 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Q1. お仕事・活動の分野 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`p-3 text-sm rounded-lg border transition-all ${
                        industry === ind
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: 立場 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Q2. お立場 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`p-3 text-sm rounded-lg border transition-all ${
                        position === pos
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3: 課題（複数選択） */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Q3. 地域やお仕事で感じている課題（複数選択可）<span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHALLENGES.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChallenge(ch)}
                      className={`p-3 text-sm rounded-lg border transition-all text-left ${
                        challenges.includes(ch)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4: 聞きたいこと */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Q4. 本イベントで聞きたいこと・期待すること（任意）
                </label>
                <Textarea
                  placeholder="AIについて知りたいこと、解決したい課題など..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Q5: AIへの関心度 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Q5. AIへの関心度 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AI_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setAiInterest(interest)}
                      className={`p-3 text-sm rounded-lg border transition-all ${
                        aiInterest === interest
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
