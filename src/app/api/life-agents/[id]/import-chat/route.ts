import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // Forward the multipart form data directly to the Go backend
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const formData = await req.formData();
    const backendRes = await fetch(
      `${API_BACKEND}/api/life-agents/${id}/import-chat`,
      {
        method: "POST",
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // SSE streaming response
    const ct = backendRes.headers.get("content-type") || "";
    if (ct.includes("text/event-stream") && backendRes.body) {
      return new Response(backendRes.body, {
        status: backendRes.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Non-streaming response (errors etc.)
    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "请求超时，分析时间过长" },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: "后端连接失败" }, { status: 502 });
  }
}
