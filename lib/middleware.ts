import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const session = request.cookies.get("session");
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/dashboard") && !session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if ((pathname === "/login" || pathname === "/singup") && session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/singup"],
};