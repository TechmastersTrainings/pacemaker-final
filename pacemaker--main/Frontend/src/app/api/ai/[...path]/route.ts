import { NextRequest, NextResponse } from 'next/server';

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

// We proxy the traffic through Next.js so we can catch connection errors on the server side
// and return a 200 OK with a fallback message to the frontend, preventing the browser
// from logging scary red ERR_CONNECTION_REFUSED network errors natively.

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  try {
    const isPost = req.method === 'POST';
    const body = isPost ? await req.json().catch(() => null) : undefined;
    
    const requestHeaders = new Headers(req.headers);
    // Don't forward host header so fetch resolves proper localhost/IP
    requestHeaders.delete('host');

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    if (isPost && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Attempt connection
    let targetUrl = `${AI_BASE_URL}/${path}`;
    const searchParams = req.nextUrl.search;
    if (searchParams) {
      targetUrl += searchParams;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const res = await fetch(targetUrl, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`AI service responded with ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data);
    }
    
    // For PDFs or other binary files, return the raw blob
    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        ...(res.headers.get('content-disposition') ? { 'Content-Disposition': res.headers.get('content-disposition')! } : {})
      }
    });
  } catch (error) {
    // If connection refused, timed out, or returning a non-200 error,
    // we return a 200 OK JSON with a specific mock response so frontend fallback 
    // mechanism in aiService.ts can just return the fallback gracefully WITHOUT throwing 
    // network-level ERR_CONNECTION_REFUSED inside the user's browser.
    
    // Instead of parsing the path and creating exact mock here, we can just return a 
    // JSON response that throws an error in axios inside aiService.ts!
    // WAIT: if we return a 503 error, browser still logs "GET ... 503" in red.
    // So we return 200 OK, with a special flag:
    return NextResponse.json({ _server_connection_failed: true, reason: String(error) }, { status: 200 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
