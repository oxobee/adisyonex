"use client"

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body>
        <div style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ fontSize: "3rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Bir hata oluştu</h2>
          <p style={{ color: "#666", maxWidth: "400px", fontSize: "0.9rem" }}>
            Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#999" }}>
              Hata kodu: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.5rem",
              border: "1px solid #ccc",
              borderRadius: "0.375rem",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            🔄 Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  )
}
