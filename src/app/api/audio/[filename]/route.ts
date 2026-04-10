import { NextRequest } from "next/server";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } },
) {
  try {
    const backendRes = await fetch(
      `${API_BACKEND}/api/audio/${encodeURIComponent(params.filename)}`,
      {
        headers: {
          range: req.headers.get("range") || "",
        },
      },
    );

    if (!backendRes.ok || !backendRes.body) {
      return new Response("Not Found", { status: backendRes.status || 404 });
    }

    const headers = new Headers();
    const contentType = backendRes.headers.get("content-type");
    const cacheControl = backendRes.headers.get("cache-control");
    const acceptRanges = backendRes.headers.get("accept-ranges");
    const contentLength = backendRes.headers.get("content-length");
    const contentRange = backendRes.headers.get("content-range");

    if (contentType) headers.set("Content-Type", contentType);
    if (cacheControl) headers.set("Cache-Control", cacheControl);
    if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers,
    });
  } catch {
    return new Response("Bad Gateway", { status: 502 });
  }
}
