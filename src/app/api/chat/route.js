import { NextResponse } from 'next/server';
import { sendChatMessage } from '@/services/aiService';
import { sanitizeInput } from '@/utils';

const rateLimit = new Map();

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const key = `chat_${ip}`;
  const now = Date.now();
  const recent = (rateLimit.get(key) || []).filter(t => now - t < 60000);
  if (recent.length >= 30) {
    return NextResponse.json({ error: 'Tezlik limiti. Biroz kuting.' }, { status: 429 });
  }
  rateLimit.set(key, [...recent, now]);

  try {
    const body = await request.json();

    // Support both formats: { messages } array OR { message, history }
    let messages;
    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter(m => m.role && m.content)
        .map(m => ({
          role: ['user', 'assistant'].includes(m.role) ? m.role : 'user',
          content: sanitizeInput(String(m.content)).slice(0, 2000),
        }))
        .slice(-20);
    } else if (body.message) {
      const sanitized = sanitizeInput(body.message.trim()).slice(0, 2000);
      if (!sanitized) {
        return NextResponse.json({ error: "Xabar bo'sh bo'lishi mumkin emas" }, { status: 400 });
      }
      const history = (Array.isArray(body.history) ? body.history : [])
        .slice(-10)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 500) }));
      messages = [...history, { role: 'user', content: sanitized }];
    } else {
      return NextResponse.json({ error: "Xabar majburiy" }, { status: 400 });
    }

    if (!messages.length) {
      return NextResponse.json({ error: "Xabar bo'sh" }, { status: 400 });
    }

    const result = await sendChatMessage(messages);
    return NextResponse.json({ text: result.text, provider: result.provider });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Javob olishda xato yuz berdi' }, { status: 500 });
  }
}
