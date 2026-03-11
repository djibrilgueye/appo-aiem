"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Step = "email" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep]     = useState<Step>("email")
  const [email, setEmail]   = useState("")
  const [otp, setOtp]       = useState("")
  const [error, setError]   = useState("")
  const [info, setInfo]     = useState("")
  const [loading, setLoading] = useState(false)

  // ── Step 1: email → request OTP ─────────────────────────────────────────
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setInfo("")

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to send verification code")
      } else {
        setInfo(data.message ?? "Check your email for a 6-digit code.")
        setStep("otp")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: submit OTP → verify → create session ─────────────────────────
  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        setError(verifyData.error ?? "Verification failed")
        setLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email,
        otpProofToken: verifyData.otpProofToken,
        redirect: false,
      })

      if (result?.error) {
        setError("Session creation failed. Please try again.")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setLoading(true)
    setError("")
    setOtp("")
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not resend code")
      } else {
        setInfo("A new code has been sent to your email.")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
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

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#1B4F72",
    color: "#ffffff",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
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
            <div style={{ fontSize: "12px", color: "#5B8FB9", fontFamily: "Arial, sans-serif" }}>
              {step === "email" ? "Sign In" : "Two-Factor Verification"}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: "#1B4F72" }} />
          <div style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: step === "otp" ? "#1B4F72" : "#D0E4F0" }} />
        </div>

        {/* Banners */}
        {error && (
          <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA", color: "#B91C1C", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", fontFamily: "Arial, sans-serif" }}>
            {error}
          </div>
        )}
        {info && !error && (
          <div style={{ backgroundColor: "#EBF3FB", border: "1px solid #A3C4DC", color: "#1B4F72", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", fontFamily: "Arial, sans-serif" }}>
            {info}
          </div>
        )}

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
              />
            </div>
            <p style={{ margin: 0, color: "#9CA3AF", fontSize: "12px", fontFamily: "Arial, sans-serif", lineHeight: "1.5" }}>
              We&apos;ll send a one-time code to your email address.
            </p>
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? "Sending code…" : "Send code →"}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <form onSubmit={handleOtp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#5B8FB9", fontFamily: "Arial, sans-serif", lineHeight: "1.7" }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: "#1B4F72" }}>{email}</strong>
              </div>
            </div>

            <div>
              <label style={{ ...labelStyle, textAlign: "center" }}>Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                style={{
                  ...inputStyle,
                  fontSize: "30px",
                  letterSpacing: "12px",
                  textAlign: "center",
                  fontFamily: "'Courier New', monospace",
                  padding: "14px",
                }}
                required
              />
            </div>

            <button type="submit" disabled={loading || otp.length !== 6} style={btnPrimary}>
              {loading ? "Verifying…" : "Sign In"}
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
              <button type="button" onClick={handleResend} disabled={loading}
                style={{ background: "none", border: "none", color: "#1B4F72", fontSize: "13px", cursor: "pointer", textDecoration: "underline", fontFamily: "Arial, sans-serif" }}>
                Resend code
              </button>
              <button type="button"
                onClick={() => { setStep("email"); setError(""); setOtp(""); setInfo("") }}
                style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "12px", cursor: "pointer", fontFamily: "Arial, sans-serif" }}>
                ← Back
              </button>
            </div>
          </form>
        )}

        <p style={{ color: "#9CA3AF", fontSize: "12px", textAlign: "center", marginTop: "24px", fontFamily: "Arial, sans-serif" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#1B4F72", textDecoration: "underline" }}>Register</Link>
        </p>
      </div>
    </div>
  )
}
