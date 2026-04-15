import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const backendRes = await fetch(`${API_BACKEND}/api/transcribe`, {
      method: "POST",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
      body: formData,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ error: "transcription failed" }, { status: 502 });
  }
}
