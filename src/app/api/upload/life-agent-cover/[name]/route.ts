import { readFile } from "fs/promises";
import path from "path";

const CONTENT_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function coverStorageDir() {
  return path.join(process.cwd(), "public", "uploads", "life-agent-covers");
}

export async function GET(_: Request, { params }: { params: { name: string } }) {
  const rawName = (params.name ?? "").trim();
  if (!rawName || rawName.includes("/") || rawName.includes("\\") || rawName.includes("..")) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = path.extname(rawName).toLowerCase();
  const contentType = CONTENT_TYPE[ext];
  if (!contentType) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const fullPath = path.join(coverStorageDir(), rawName);
    const file = await readFile(fullPath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
