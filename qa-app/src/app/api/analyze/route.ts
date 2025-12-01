import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getQuestions, saveAnalysis } from '@/lib/store';
import { AnalysisResult, CategoryResult, Question } from '@/lib/types';

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

    const prompt = `あなたはイベントの質問・コメントを分析するアシスタントです。

以下の質問/コメントリストを分析してください：

${questionsText}

以下の形式でJSON形式で回答してください（日本語で）：

{
  "summary": "全体の傾向を3文以内で要約",
  "categories": [
    {
      "name": "カテゴリ名（例：技術的質問、意見・感想、要望・提案、その他）",
      "questionIds": ["該当する質問のID"],
      "insight": "このカテゴリの質問の傾向や特徴を1-2文で説明"
    }
  ]
}

必ず有効なJSONのみを出力してください。説明文は不要です。`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
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

    const categories: CategoryResult[] = parsed.categories.map((cat: { name: string; questionIds: string[]; insight: string }) => ({
      name: cat.name,
      questions: cat.questionIds
        .map((id: string) => questionsMap.get(id))
        .filter((q: Question | undefined): q is Question => q !== undefined),
      insight: cat.insight,
    }));

    const analysis: AnalysisResult = {
      summary: parsed.summary,
      categories,
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
