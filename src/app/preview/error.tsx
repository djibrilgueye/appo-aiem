"use client"

export default function PreviewError({ reset }: { reset: () => void }) {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f6f8", color: "#173c4b" }}><div><h1>Les données ne sont pas disponibles</h1><p>Vérifiez la base locale et le dossier de recherche, puis réessayez.</p><button onClick={reset}>Réessayer</button></div></main>
}
