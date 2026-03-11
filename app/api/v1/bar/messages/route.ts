import { NextRequest, NextResponse } from 'next/server';
import { getRecentMessages, Location } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') as Location | null;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 200' },
        { status: 400 }
      );
    }

    const messages = await getRecentMessages(limit, location || undefined);

    return NextResponse.json({
      messages,
      count: messages.length,
      location: location || 'all',
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
