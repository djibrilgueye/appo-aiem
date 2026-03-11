"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageContext"

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [name, setName]     = useState("")
  const [email, setEmail]   = useState("")
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
      } else {
        router.push("/login?registered=true")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #D0E4F0",
    backgroundColor: "#F4F7FB",
    color: "#0D2840",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#5B8FB9",
    fontSize: "13px",
    marginBottom: "6px",
    fontFamily: "Arial, sans-serif",
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#F4F7FB",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div style={{
        backgroundColor: "#ffffff", padding: "40px", borderRadius: "14px",
        boxShadow: "0 8px 32px rgba(27,79,114,0.14)", width: "100%", maxWidth: "420px",
        border: "1px solid #D0E4F0",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#EBF3FB", border: "1px solid #A3C4DC", borderRadius: "8px", padding: "6px" }}>
            <img src="/appo_logo.jpeg" alt="APPO" style={{ height: "40px", width: "40px", borderRadius: "4px", objectFit: "contain", backgroundColor: "#fff" }} />
          </div>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "18px", color: "#1B4F72", fontFamily: "Arial, sans-serif" }}>AIEM</div>
            <div style={{ fontSize: "12px", color: "#5B8FB9", fontFamily: "Arial, sans-serif" }}>Create Account</div>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA", color: "#B91C1C", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", fontFamily: "Arial, sans-serif" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>{t.auth.nameLabel}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              style={inputStyle} required autoComplete="name" autoFocus />
          </div>
          <div>
            <label style={labelStyle}>{t.auth.emailLabel}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle} required autoComplete="email" />
          </div>
          <p style={{ margin: 0, color: "#9CA3AF", fontSize: "12px", fontFamily: "Arial, sans-serif", lineHeight: "1.5" }}>
            No password needed — you&apos;ll sign in with a one-time code sent to your email.
          </p>
          <button type="submit" disabled={loading} style={{
            width: "100%", backgroundColor: "#1B4F72", color: "#ffffff",
            padding: "12px", borderRadius: "8px", border: "none",
            fontSize: "15px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1, fontFamily: "Arial, sans-serif",
          }}>
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>

        <p style={{ color: "#9CA3AF", fontSize: "12px", textAlign: "center", marginTop: "24px", fontFamily: "Arial, sans-serif" }}>
          {t.auth.hasAccount}{" "}
          <Link href="/login" style={{ color: "#1B4F72", textDecoration: "underline" }}>{t.auth.signIn}</Link>
        </p>
      </div>
    </div>
  )
}
