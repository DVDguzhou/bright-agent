import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 访问 `/` 一律进入发现流（含桌面；营销首页仍可通过站内链接打开）。 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/life-agents";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
