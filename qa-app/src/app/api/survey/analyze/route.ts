import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSurveyResponses, saveSurveyAnalysis } from '@/lib/store';
import { SurveyAnalysis, SurveyResponse, CrossAnalysisItem } from '@/lib/types';

const anthropic = new Anthropic();

function calculateDistribution(
  responses: SurveyResponse[],
  field: keyof SurveyResponse
): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const value = r[field] as string;
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
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

// クロス分析: カテゴリ別の分布を計算
function calculateCrossAnalysis(
  responses: SurveyResponse[],
  categoryField: keyof SurveyResponse,
  valueField: keyof SurveyResponse | 'challenges'
): CrossAnalysisItem[] {
  const result: Record<string, Record<string, number>> = {};

  for (const r of responses) {
    const category = r[categoryField] as string;
    if (!category) continue;

    if (!result[category]) {
      result[category] = {};
    }

    if (valueField === 'challenges') {
      for (const challenge of r.challenges) {
        result[category][challenge] = (result[category][challenge] || 0) + 1;
      }
    } else {
      const value = r[valueField] as string;
      if (value) {
        result[category][value] = (result[category][value] || 0) + 1;
      }
    }
  }

  return Object.entries(result).map(([category, items]) => ({
    category,
    items: Object.entries(items)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }));
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
    const ageDistribution = calculateDistribution(responses, 'ageGroup');
    const industryDistribution = calculateDistribution(responses, 'industry');
    const positionDistribution = calculateDistribution(responses, 'position');
    const aiInterestDistribution = calculateDistribution(responses, 'aiInterest');
    const challengeRanking = calculateChallengeRanking(responses);

    // クロス分析
    const ageVsAiInterest = calculateCrossAnalysis(responses, 'ageGroup', 'aiInterest');
    const ageVsChallenges = calculateCrossAnalysis(responses, 'ageGroup', 'challenges');
    const industryVsChallenges = calculateCrossAnalysis(responses, 'industry', 'challenges');

    // 自由記述の質問を抽出
    const freeQuestions = responses
      .filter((r) => r.question && r.question.trim().length > 0)
      .map((r) => ({
        question: r.question,
        ageGroup: r.ageGroup,
        industry: r.industry,
        industryOther: r.industryOther,
        challenges: r.challenges,
      }));

    // AIに分析させるデータを準備
    const analysisData = {
      totalResponses: responses.length,
      ageDistribution,
      industryDistribution,
      positionDistribution,
      aiInterestDistribution,
      challengeRanking,
      crossAnalysis: {
        ageVsAiInterest,
        ageVsChallenges,
        industryVsChallenges,
      },
      freeQuestions,
    };

    const prompt = `あなたはAI・テクノロジーの専門家であり、地方創生にも詳しいコンサルタントです。

以下は「AIの進化と地方創生 〜和歌山の未来をひらく〜」というイベントの事前アンケート結果です。
参加者は和歌山大学経済学部OB、地域ビジネス関係者です。

【アンケート結果】
${JSON.stringify(analysisData, null, 2)}

このデータを分析し、以下の形式でJSON形式で回答してください：

{
  "openingSummary": "開会で司会者がそのまま読める1-2文のサマリー。例：「本日の参加者は〇〇代の方が多く、〇〇業を中心に、△△に関心が高い方々にお集まりいただきました」",
  "challengeInsights": [
    "課題傾向から読み取れるインサイトを3つ程度"
  ],
  "interestingFindings": [
    "クロス分析から発見した興味深いインサイトを3-5つ。例：「60代以上はAIに期待している人が多いが、30代は不安を感じている人が多い」「観光業は外国人対応、農業は担い手不足が突出して課題に挙がっている」など、データから読み取れる意外な発見や面白い傾向"
  ],
  "representativeQuestions": [
    {
      "question": "参加者の関心を代表する質問（AIが生成）",
      "category": "基礎知識 | 導入検討 | 具体的活用 | 懸念・不安 のいずれか",
      "basedOn": "この質問を作成した根拠（どんな傾向から導出したか）",
      "expertAnswer": "AI・地方創生の専門家として、一般ビジネスパーソンにもわかりやすく回答（3-5文）。専門用語は避けるか、使う場合は簡単な説明を添える。和歌山の文脈を意識した具体例があるとなお良い。"
    }
  ],
  "notableComments": [
    "自由記述から印象的なコメントを3-5つ抜粋（原文のまま）。なければ空配列"
  ]
}

注意点：
- openingSummaryは司会者が開会であいさつ時にそのまま読める文章にしてください
- interestingFindingsはクロス分析データをしっかり見て、年代別・業種別の違いを具体的に指摘してください
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
      openingSummary: parsed.openingSummary || '',
      profileSummary: {
        totalResponses: responses.length,
        ageDistribution,
        industryDistribution,
        positionDistribution,
        aiInterestDistribution,
      },
      challengeAnalysis: {
        ranking: challengeRanking,
        insights: parsed.challengeInsights || [],
      },
      crossAnalysis: {
        ageVsAiInterest,
        ageVsChallenges,
        industryVsChallenges,
        interestingFindings: parsed.interestingFindings || [],
      },
      representativeQuestions: parsed.representativeQuestions || [],
      notableComments: parsed.notableComments || [],
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
