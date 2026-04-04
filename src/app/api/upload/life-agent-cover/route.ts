import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:8080";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

function coverStorageDir() {
  return path.join(process.cwd(), "public", "uploads", "life-agent-covers");
}

async function requireSession(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false;
  const res = await fetch(`${API_BACKEND}/api/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  return res.ok;
}

export async function POST(req: Request) {
  if (!(await requireSession(req.headers.get("cookie")))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "EXPECTED_FORM_DATA" }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED.get(mime);
  if (!ext) {
    return NextResponse.json({ error: "UNSUPPORTED_TYPE" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${crypto.randomUUID()}.${ext}`;
  const dir = coverStorageDir();
  await mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  await writeFile(full, buf);

  return NextResponse.json({ url: `/api/upload/life-agent-cover/${name}` });
}
