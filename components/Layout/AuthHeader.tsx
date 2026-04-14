"use client";

import Link from "next/link";

interface AuthHeaderProps {
  isLogin?: boolean;
}

function AuthHeader({ isLogin = false }: AuthHeaderProps) {
  return (
    <header className="h-16 border-b border-teal-900/50 bg-[#0a1a2e]/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-100 hover:text-teal-300 transition">
          <img
            className="h-8 w-8 rounded-lg object-cover"
            src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png"
            alt="Mente en Calma"
          />
          <span>Mente en Calma</span>
        </Link>
        <div className="flex items-center gap-3">
          {isLogin ? (
            <Link
              href="/singup"
              className="rounded-xl border border-teal-700/50 px-4 py-1.5 text-sm text-teal-200 hover:border-teal-400 hover:text-teal-300 transition"
            >
              Regístrate
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-teal-700/50 px-4 py-1.5 text-sm text-teal-200 hover:border-teal-400 hover:text-teal-300 transition"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default AuthHeader;
