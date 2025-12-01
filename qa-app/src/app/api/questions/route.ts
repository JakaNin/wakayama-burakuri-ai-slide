import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getQuestions, addQuestion, clearQuestions } from '@/lib/store';
import { Question } from '@/lib/types';

export async function GET() {
  try {
    const questions = await getQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to get questions:', error);
    return NextResponse.json(
      { error: 'Failed to get questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const question: Question = {
      id: uuidv4(),
      content: content.trim(),
      timestamp: Date.now(),
    };

    await addQuestion(question);

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Failed to add question:', error);
    return NextResponse.json(
      { error: 'Failed to add question' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearQuestions();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear questions:', error);
    return NextResponse.json(
      { error: 'Failed to clear questions' },
      { status: 500 }
    );
  }
}
