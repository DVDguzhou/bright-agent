import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const backendRes = await fetch(`${API_BACKEND}/api/upload/life-agent-cover`, {
      method: "POST",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
      body: formData,
    });

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { "Content-Type": backendRes.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "UPLOAD_PROXY_FAILED" }, { status: 502 });
  }
}
