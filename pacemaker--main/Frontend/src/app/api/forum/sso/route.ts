import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { payload, secret } = await request.json();
    
    if (!payload || !secret) {
      return NextResponse.json(
        { error: 'Payload and secret are required parameters.' },
        { status: 400 }
      );
    }

    // Compute HMAC-SHA256 signature of the payload using the secret key
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return NextResponse.json({ signature });
  } catch (error: any) {
    console.error('Error generating SSO signature:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during signing' },
      { status: 500 }
    );
  }
}
