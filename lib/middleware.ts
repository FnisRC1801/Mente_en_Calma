import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session");
    const { pathname } = request.nextUrl;

    // Sin sesión → redirige al login si intenta entrar a dashboards
    if (!session) {
        if (
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/dashboard_psico") ||
            pathname.startsWith("/dashbooard_SU")
        ) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        return NextResponse.next();
    }

    // Con sesión → verificar rol via API interna
    try {
        const verifyRes = await fetch(
            new URL("/api/auth/verify-role", request.url).toString(),
            {
                headers: { Cookie: `session=${session.value}` },
                cache: "no-store",
            }
        );

        if (!verifyRes.ok) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const { role } = await verifyRes.json();

        // Redirige al dashboard correcto si está en login
        if (pathname === "/login" || pathname === "/singup") {
            if (role === "superusuario") return NextResponse.redirect(new URL("/dashbooard_SU", request.url));
            if (role === "psicologo") return NextResponse.redirect(new URL("/dashboard_psico", request.url));
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Protege rutas por rol
        if (pathname.startsWith("/dashbooard_SU") && role !== "superusuario") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        if (pathname.startsWith("/dashboard_psico") && role !== "psicologo") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

    } catch {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/dashboard_psico/:path*",
        "/dashbooard_SU/:path*",
        "/login",
        "/singup",
    ],
};