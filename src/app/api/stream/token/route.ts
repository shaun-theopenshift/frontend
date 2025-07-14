import { StreamChat } from 'stream-chat';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('Stream API key or secret not set');
      return NextResponse.json({ error: 'Stream API key or secret not set' }, { status: 500 });
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    const token = serverClient.createToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error creating Stream token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 