import { NextRequest, NextResponse } from 'next/server';

/**
 * Optional: proxy /api/proxy/* to the FastAPI backend so the browser
 * never has to deal with cross-origin requests. Not used by lib/api.ts
 * by default (it calls NEXT_PUBLIC_API_BASE_URL directly), but handy if
 * CORS becomes a problem during the hackathon — point NEXT_PUBLIC_API_BASE_URL
 * at "/api/proxy" instead of the raw backend URL to route through this.
 */

const BACKEND_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetUrl = `${BACKEND_URL}/${path.join('/')}${req.nextUrl.search}`;

  const res = await fetch(targetUrl, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
  });

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};
