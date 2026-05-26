"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const esRutaProtegida = pathname.startsWith("/dashboard") || pathname.startsWith("/dashboard-psico");
      const esRutaPublica = pathname.startsWith("/login") || pathname.startsWith("/singup");

      if (!user && esRutaProtegida) {
        router.push("/login");
      } else if (user && esRutaPublica) {
        try {
          const roleRes = await fetch("/api/auth/verify-role");
          const { hasDoc, role } = await roleRes.json();
          if (hasDoc) {
            if (role === "psicologo") router.push("/dashboard-psico");
            else router.push("/dashboard");
          }
          // Si hasDoc es false = Google nuevo, se queda en /singup
        } catch {
          router.push("/dashboard");
        }
      }

      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {loadingAuth ? (
            <div style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8fafb",
              flexDirection: "column",
              gap: "14px"
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                border: "3px solid #e5e7eb",
                borderTopColor: "#4a8a85",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <p style={{ fontFamily: "sans-serif", color: "#4a8a85", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.02em" }}>
                Sincronizando sesión segura...
              </p>
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
            </div>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}