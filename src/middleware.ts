import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
export { default } from "next-auth/middleware";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  // console.log("Token", !token);
  const url = request.nextUrl;
  if (
    (!token && url.pathname === "/sign-up") ||
    url.pathname.startsWith("/verify*")
  ) {
    return NextResponse.next();
  }
  if (
    (token && url.pathname === "/sign-in") ||
    url.pathname === "/sign-up" ||
    url.pathname.startsWith("/verify")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!token && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-in", "/sign-up", "/", "/dashboard/:path*", "/verify/:path*"],
};
