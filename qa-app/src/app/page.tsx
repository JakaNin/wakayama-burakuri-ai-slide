'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('質問・コメントを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        throw new Error('送信に失敗しました');
      }

      setContent('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">
            ぶらくり会 AI Q&A
          </CardTitle>
          <CardDescription className="text-base">
            質問やコメントを投稿してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="AIについての質問や感想を入力..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {submitted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-center">
                ✅ 投稿完了！ありがとうございます
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? '送信中...' : '投稿する'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            匿名で投稿されます
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
