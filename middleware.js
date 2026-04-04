import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/@")) {
    const handle = pathname.slice(2).split("/")[0];
    if (handle) {
      const url = request.nextUrl.clone();
      url.pathname = `/channel/${handle}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

