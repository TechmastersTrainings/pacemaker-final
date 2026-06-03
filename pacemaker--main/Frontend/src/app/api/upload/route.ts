import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Range',
    },
  });
}

export async function PUT() {
  // Simulate network delay for a more realistic upload feel
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return new NextResponse(JSON.stringify({ data: { id: "mock-video-id" } }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
