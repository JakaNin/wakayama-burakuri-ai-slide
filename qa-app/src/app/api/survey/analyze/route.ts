import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSurveyResponses, saveSurveyAnalysis } from '@/lib/store';
import { SurveyAnalysis, SurveyResponse } from '@/lib/types';

const anthropic = new Anthropic();

function calculateDistribution(
  responses: SurveyResponse[],
  field: keyof SurveyResponse
): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const value = r[field] as string;
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function calculateChallengeRanking(
  responses: SurveyResponse[]
): { challenge: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    for (const challenge of r.challenges) {
      counts[challenge] = (counts[challenge] || 0) + 1;
    }
  }
  const total = responses.length;
  return Object.entries(counts)
    .map(([challenge, count]) => ({
      challenge,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function POST() {
  try {
    const responses = await getSurveyResponses();

    if (responses.length === 0) {
      return NextResponse.json(
        { error: 'No survey responses to analyze' },
        { status: 400 }
      );
    }

    // 統計データを計算
    const industryDistribution = calculateDistribution(responses, 'industry');
    const positionDistribution = calculateDistribution(responses, 'position');
    const aiInterestDistribution = calculateDistribution(responses, 'aiInterest');
    const challengeRanking = calculateChallengeRanking(responses);

    // 自由記述の質問を抽出
    const freeQuestions = responses
      .filter((r) => r.question && r.question.trim().length > 0)
      .map((r) => ({
        question: r.question,
        industry: r.industry,
        challenges: r.challenges,
      }));

    // AIに分析させるデータを準備
    const analysisData = {
      totalResponses: responses.length,
      industryDistribution,
      positionDistribution,
      aiInterestDistribution,
      challengeRanking,
      freeQuestions,
    };

    const prompt = `あなたはAI・テクノロジーの専門家であり、地方創生にも詳しいコンサルタントです。

以下は「AIの進化と地方創生 〜和歌山の未来をひらく〜」というイベントの事前アンケート結果です。
参加者は和歌山大学経済学部OB、地域ビジネス関係者（30-80歳、非IT多め）です。

【アンケート結果】
${JSON.stringify(analysisData, null, 2)}

このデータを分析し、以下の形式でJSON形式で回答してください：

{
  "challengeInsights": [
    "課題傾向から読み取れるインサイトを3つ程度"
  ],
  "representativeQuestions": [
    {
      "question": "参加者の関心を代表する質問（AIが生成）",
      "category": "基礎知識 | 導入検討 | 具体的活用 | 懸念・不安 のいずれか",
      "basedOn": "この質問を作成した根拠（どんな傾向から導出したか）",
      "expertAnswer": "AI・地方創生の専門家として、一般ビジネスパーソンにもわかりやすく回答（3-5文）。専門用語は避けるか、使う場合は簡単な説明を添える。和歌山の文脈を意識した具体例があるとなお良い。"
    }
  ],
  "speakerFeedback": [
    {
      "speaker": "樫本さん（地域コミュニティ研究）",
      "suggestions": ["プレゼンで強調すべきポイント2-3個"]
    },
    {
      "speaker": "西山さん（AI実践デモ）",
      "suggestions": ["デモで取り上げると響くテーマ2-3個"]
    },
    {
      "speaker": "中村さん（AI開発・可能性）",
      "suggestions": ["参加者に響きそうなポイント2-3個"]
    }
  ]
}

注意点：
- representativeQuestionsは、自由記述の質問と選択された課題の傾向から、参加者の関心を代表する質問を5-7つ生成してください
- 自由記述がない場合でも、選択された課題の傾向から代表質問を生成してください
- expertAnswerは「です・ます調」で、親しみやすく丁寧に
- 和歌山の地域文脈（観光、農業、熊野古道など）を意識した回答を心がけてください
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

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const analysis: SurveyAnalysis = {
      profileSummary: {
        totalResponses: responses.length,
        industryDistribution,
        positionDistribution,
        aiInterestDistribution,
      },
      challengeAnalysis: {
        ranking: challengeRanking,
        insights: parsed.challengeInsights || [],
      },
      representativeQuestions: parsed.representativeQuestions || [],
      speakerFeedback: parsed.speakerFeedback || [],
      analyzedAt: Date.now(),
    };

    await saveSurveyAnalysis(analysis);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Failed to analyze survey:', error);
    return NextResponse.json(
      { error: 'Failed to analyze survey responses' },
      { status: 500 }
    );
  }
}
