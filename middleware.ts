import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 手机 / 平板访问根路径时直接进入人生 Agent 浏览页，不再展示营销首页。
 * 优先使用 Sec-CH-UA-Mobile，其次 User-Agent 启发式（含 iPad、Android 手机与常见平板）。
 */
function isPhoneOrTablet(request: NextRequest): boolean {
  const chMobile = request.headers.get("sec-ch-ua-mobile");
  if (chMobile === "?1") return true;

  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  if (!ua) return false;

  return (
    /iphone|ipod|ipad/.test(ua) ||
    /android/.test(ua) ||
    /micromessenger|mqqbrowser| wv\)|crosswalk/.test(ua) ||
    /mobile|tablet|kindle|silk|playbook|bb10|blackberry|iemobile|bada|webos|opera mini|windows phone|huawei|honor|xiaomi|oppo|vivo|realme|redmi|oneplus|samsungbrowser/.test(
      ua
    )
  );
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  if (isPhoneOrTablet(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/life-agents";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
