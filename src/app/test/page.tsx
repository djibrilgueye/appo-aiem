export default function TestPage() {
  return (
    <div style={{ padding: "50px", backgroundColor: "#0b1220", minHeight: "100vh" }}>
      <h1 style={{ color: "white", fontSize: "32px" }}>Test Page</h1>
      <p style={{ color: "cyan" }}>Si vous voyez ce texte, le rendu fonctionne.</p>
      <a href="/login" style={{ color: "yellow" }}>Go to Login</a>
    </div>
  )
}
