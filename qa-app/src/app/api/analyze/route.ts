import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getQuestions, saveAnalysis } from '@/lib/store';
import { AnalysisResult, PickedQuestion, Question } from '@/lib/types';

const anthropic = new Anthropic();

export async function POST() {
  try {
    const questions = await getQuestions();

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions to analyze' },
        { status: 400 }
      );
    }

    const questionsText = questions
      .map((q, i) => `${i + 1}. [ID: ${q.id}] ${q.content}`)
      .join('\n');

    const prompt = `あなたはAI・テクノロジーの専門家であり、一般のビジネスパーソン向けにわかりやすく解説することに長けています。

以下は、AIに関するイベントで参加者から寄せられた質問・コメントです：

${questionsText}

これらを分析し、以下の形式でJSON形式で回答してください：

{
  "summary": "全体の質問傾向を2-3文で要約。参加者がどんなことに関心を持っているかがわかるように",
  "keyInsights": [
    "質問から読み取れる重要な気づき・傾向を3つ程度"
  ],
  "pickedQuestions": [
    {
      "questionId": "重要な質問のID",
      "importance": "high または medium",
      "reason": "なぜこの質問が重要か（1文）",
      "expertAnswer": "AI専門家として、一般ビジネスパーソンにもわかりやすく回答（3-5文程度）。専門用語は避けるか、使う場合は簡単な説明を添える。具体例があるとなお良い。"
    }
  ]
}

注意点：
- pickedQuestionsは重要度の高い質問を最大5つまで選んでください
- expertAnswerは「です・ます調」で、親しみやすく丁寧に
- 難しい概念は身近な例え話を使って説明
- 必ず有効なJSONのみを出力してください`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const questionsMap = new Map(questions.map(q => [q.id, q]));

    const pickedQuestions: PickedQuestion[] = (parsed.pickedQuestions || [])
      .map((pq: { questionId: string; importance: 'high' | 'medium'; reason: string; expertAnswer: string }) => {
        const question = questionsMap.get(pq.questionId);
        if (!question) return null;
        return {
          question,
          importance: pq.importance,
          reason: pq.reason,
          expertAnswer: pq.expertAnswer,
        };
      })
      .filter((pq: PickedQuestion | null): pq is PickedQuestion => pq !== null);

    const analysis: AnalysisResult = {
      summary: parsed.summary,
      keyInsights: parsed.keyInsights || [],
      pickedQuestions,
      analyzedAt: Date.now(),
    };

    await saveAnalysis(analysis);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Failed to analyze:', error);
    return NextResponse.json(
      { error: 'Failed to analyze questions' },
      { status: 500 }
    );
  }
}
