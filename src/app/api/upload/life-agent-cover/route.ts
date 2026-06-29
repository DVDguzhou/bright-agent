import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";
type NodeStreamRequestInit = RequestInit & { duplex: "half" };

export async function POST(req: NextRequest) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const headers = new Headers();
    const cookie = req.headers.get("cookie");
    const contentType = req.headers.get("content-type");
    const contentLength = req.headers.get("content-length");

    if (cookie) headers.set("cookie", cookie);
    if (contentType) headers.set("content-type", contentType);
    if (contentLength) headers.set("content-length", contentLength);

    const backendReq: NodeStreamRequestInit = {
      method: "POST",
      headers,
      body: req.body,
      duplex: "half",
      signal: controller.signal,
    };
    const backendRes = await fetch(`${API_BACKEND}/api/upload/life-agent-cover`, backendReq);
    clearTimeout(timeoutId);

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { "Content-Type": backendRes.headers.get("content-type") || "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "UPLOAD_PROXY_TIMEOUT" }, { status: 504 });
    }
    return NextResponse.json({ error: "UPLOAD_PROXY_FAILED" }, { status: 502 });
  }
}
