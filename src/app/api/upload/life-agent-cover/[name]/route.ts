const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

export async function GET(_: Request, { params }: { params: { name: string } }) {
  try {
    const backendRes = await fetch(`${API_BACKEND}/api/upload/life-agent-cover/${encodeURIComponent(params.name)}`, {
      cache: "force-cache",
    });
    if (!backendRes.ok) {
      return new Response("Not Found", { status: backendRes.status });
    }
    const buf = await backendRes.arrayBuffer();
    return new Response(buf, {
      status: backendRes.status,
      headers: {
        "Content-Type": backendRes.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": backendRes.headers.get("cache-control") || "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Bad Gateway", { status: 502 });
  }
}
