// src/app/api/news/route.js
import { NextResponse } from 'next/server';
import { fetchCyberNews } from '@/services/newsService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '8'), 20);

  try {
    const result = await fetchCyberNews(page, pageSize);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600' },
    });
  } catch (error) {
    return NextResponse.json({ error: "Yangiliklar yuklanmadi" }, { status: 500 });
  }
}
