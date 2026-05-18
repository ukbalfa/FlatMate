import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.HCAPTCHA_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'hCaptcha not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'No captcha token provided' }, { status: 400 });
    }

    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, errorCodes: data['error-codes'] || [] }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
