import { NextRequest, NextResponse } from "next/server";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const body = Buffer.from(await req.arrayBuffer());
    const backendRes = await fetch(`${API_BACKEND}/api/upload/life-agent-cover`, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/octet-stream",
        cookie: req.headers.get("cookie") || "",
      },
      body,
    });

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { "Content-Type": backendRes.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "后端连接失败" }, { status: 502 });
  }
}
