import { NextRequest, NextResponse } from "next/server";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.text();

  try {
    const backendRes = await fetch(`${API_BACKEND}/api/life-agents/${id}/chat/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body,
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "后端连接失败" }, { status: 502 });
  }
}
