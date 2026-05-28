"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ color: "#fbba41", fontSize: "1.5rem", fontWeight: 700 }}>
            Algo salió mal
          </h1>
          <p style={{ color: "#a3a3a3", marginTop: "0.5rem" }}>
            Ocurrió un error inesperado.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              borderRadius: "0.75rem",
              background: "#e89b2d",
              color: "#0a0a0a",
              fontWeight: 700,
              padding: "0.75rem 1.5rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
