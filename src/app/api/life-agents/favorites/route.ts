import { NextRequest, NextResponse } from "next/server";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

async function proxy(req: NextRequest, method: "GET" | "POST" | "PUT") {
  try {
    const body = method === "GET" ? undefined : await req.text();
    const backendRes = await fetch(`${API_BACKEND}/api/life-agents/favorites`, {
      method,
      headers: {
        ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
        cookie: req.headers.get("cookie") || "",
      },
      body,
      cache: "no-store",
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

export async function GET(req: NextRequest) {
  return proxy(req, "GET");
}

export async function POST(req: NextRequest) {
  return proxy(req, "POST");
}

export async function PUT(req: NextRequest) {
  return proxy(req, "PUT");
}
