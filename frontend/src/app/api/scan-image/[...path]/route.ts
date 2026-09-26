import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://duly-manlike-buckle.ngrok-free.dev'
).replace(/\/+$/, '');

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ path: string[] }>;
  }
) {
  try {
    const { path } = await context.params;

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: 'Missing image path' },
        { status: 400 }
      );
    }

    const filename = path.join('/');
    const backendUrl = `${BACKEND_URL}/scans/${filename}`;

    console.log('[SCAN PROXY] Fetching:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Backend image fetch failed',
          status: response.status,
          path: filename,
        },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get('content-type') || 'image/png';

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[SCAN PROXY] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to proxy retinal image',
        message:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}