import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session");
    const { pathname } = request.nextUrl;

    if (!session) {
        if (
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/dashboard-psico") ||
            pathname.startsWith("/admin")
        ) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        return NextResponse.next();
    }

    try {
        const verifyRes = await fetch(
            new URL("/api/auth/verify-role", request.url).toString(),
            {
                headers: { Cookie: `session=${session.value}` },
                cache: "no-store",
            }
        );

        if (!verifyRes.ok) {
            const res = NextResponse.redirect(new URL("/login", request.url));
            res.cookies.delete("session");
            return res;
        }

        const { role, hasDoc } = await verifyRes.json();

        if (
            pathname === "/login" ||
            pathname === "/login-psico" ||
            pathname === "/singup" ||
            pathname === "/singup-psico"
        ) {
            // Usuario Google nuevo sin doc — dejarlo llenar el formulario
            if (!hasDoc && (pathname === "/singup" || pathname === "/singup-psico")) {
                return NextResponse.next();
            }
            if (role === "superusuario")
                return NextResponse.redirect(new URL("/admin", request.url));
            if (role === "psicologo")
                return NextResponse.redirect(new URL("/dashboard-psico", request.url));
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        if (pathname.startsWith("/admin") && role !== "superusuario") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        if (pathname.startsWith("/dashboard-psico") && role !== "psicologo") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

    } catch {
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("session");
        return res;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/dashboard-psico/:path*",
        "/admin/:path*",
        "/login",
        "/login-psico",
        "/singup",
        "/singup-psico",
    ],
};