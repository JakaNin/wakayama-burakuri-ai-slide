import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSurveyResponses, addSurveyResponse, clearSurveyResponses } from '@/lib/store';
import { SurveyResponse } from '@/lib/types';

export async function GET() {
  try {
    const responses = await getSurveyResponses();
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Failed to get survey responses:', error);
    return NextResponse.json(
      { error: 'Failed to get survey responses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { industry, position, challenges, question, aiInterest } = body;

    if (!industry || !position || !challenges || challenges.length === 0 || !aiInterest) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const response: SurveyResponse = {
      id: uuidv4(),
      timestamp: Date.now(),
      industry,
      position,
      challenges,
      question: question || '',
      aiInterest,
    };

    await addSurveyResponse(response);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Failed to add survey response:', error);
    return NextResponse.json(
      { error: 'Failed to add survey response' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSurveyResponses();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear survey responses:', error);
    return NextResponse.json(
      { error: 'Failed to clear survey responses' },
      { status: 500 }
    );
  }
}
