import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 5 分钟超时
export const dynamic = "force-dynamic";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.text();

  // 转发到 Go 后端，超时 5 分钟（兼容本地大模型思考模式）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const backendRes = await fetch(`${API_BACKEND}/api/life-agents/${id}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "请求超时，模型响应时间过长" }, { status: 504 });
    }
    return NextResponse.json({ error: "后端连接失败" }, { status: 502 });
  }
}
