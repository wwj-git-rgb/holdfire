import { NextRequest, NextResponse } from "next/server";

function getForwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = request.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;
  return headers;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: getForwardHeaders(request),
    });

    const stream = response.body;
    return new NextResponse(stream, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const body = await request.text();
    const response = await fetch(url, {
      method: "POST",
      headers: getForwardHeaders(request),
      body,
    });

    const stream = response.body;
    return new NextResponse(stream, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 });
  }
}
