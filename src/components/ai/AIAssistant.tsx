"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Loader2, Bot, User, RotateCcw, BellOff } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  error?: boolean
  isWelcome?: boolean
  timestamp?: string
}

type Locale = "fr" | "en"

const SUGGESTIONS: Record<Locale, string[]> = {
  fr: [
    "Quels pays sont membres de l'APPO ?",
    "Quelle est la production pétrolière du Nigeria ?",
    "Où se trouvent les terminaux LNG en Afrique ?",
    "Comment utiliser la carte interactive ?",
  ],
  en: [
    "Which countries are APPO members?",
    "What is Nigeria's oil production?",
    "Where are the LNG terminals in Africa?",
    "How do I use the interactive map?",
  ],
}

const AI_T = {
  welcome:       { fr: "👋 Bonjour ! Je suis **APPO-IA**, votre assistant intelligent.\n\nJe connais toutes les données de la plateforme **AIEM** : pays membres, bassins sédimentaires, réserves, production, raffineries, pipelines, terminaux LNG, stockage et pétrochimie.\n\nPosez-moi une question, par exemple :\n« Quelle est la production pétrolière de l'Algérie ? »\n« Où se trouvent les terminaux LNG en Afrique ? »", en: "👋 Hello! I'm **APPO-IA**, your intelligent assistant.\n\nI have full access to the **AIEM** platform data: member countries, sedimentary basins, reserves, production, refineries, pipelines, LNG terminals, storage, and petrochemicals.\n\nAsk me a question, for example:\n\"What is Algeria's oil production?\"\n\"Where are the LNG terminals in Africa?\"" },
  hideForever:   { fr: "Ne plus afficher l'assistant", en: "Don't show assistant again" },
  connecting:    { fr: "Connexion...", en: "Connecting..." },
  online:        { fr: "TOUJOURS À VOTRE ÉCOUTE", en: "ALWAYS AVAILABLE" },
  offline:       { fr: "Hors ligne", en: "Offline" },
  placeholder:   { fr: "Posez votre question...", en: "Ask your question..." },
  reset:         { fr: "Réinitialiser la conversation", en: "Reset conversation" },
  connError:     { fr: "Impossible de contacter l'assistant.", en: "Unable to reach the assistant." },
  connError2:    { fr: "Erreur de connexion à l'assistant.", en: "Connection error." },
  assistantName: { fr: "APPO-IA ✨", en: "APPO-IA ✨" },
  subtitle:      { fr: "L'assistant intelligent qui vous guide\nsur la plateforme AIEM.", en: "The intelligent assistant that guides\nyou through the AIEM platform." },
  headerTitle:   { fr: "Conversation", en: "Conversation" },
  headerSub:     { fr: "Posez vos questions à l'assistant", en: "Ask your questions to the assistant" },
  certified:     { fr: "APPO-IA utilise une base de données certifiée par APPO", en: "APPO-IA uses a database certified by APPO" },
}

const HIDDEN_KEY = "appo_ai_hidden"
const AUTO_OPEN_KEY = "appo_ai_auto_open_disabled"

// ─── Rendu markdown ────────────────────────────────────────────────────────────

function renderMarkdown(text: string, isUser: boolean) {
  const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\))/g)
  const nodes: React.ReactNode[] = []
  let i = 0
  while (i < parts.length) {
    const chunk = parts[i]
    if (i % 4 === 0) {
      const subparts = chunk.split(/(\*\*[^*]+\*\*)/g)
      subparts.forEach((sp, si) => {
        if (sp.startsWith("**") && sp.endsWith("**")) {
          nodes.push(<strong key={`b-${i}-${si}`}>{sp.slice(2, -2)}</strong>)
        } else {
          sp.split("\n").forEach((line, li, arr) => {
            nodes.push(line)
            if (li < arr.length - 1) nodes.push(<br key={`br-${i}-${si}-${li}`} />)
          })
        }
      })
    } else if (i % 4 === 2) {
      const label = parts[i]
      const url = parts[i + 1]
      const isExternal = url.startsWith("http")
      if (isExternal) {
        nodes.push(<a key={`link-${i}`} href={url} target="_blank" rel="noopener noreferrer" className={isUser ? "underline text-blue-200 hover:text-white" : "underline text-[#1B4F72] hover:text-[#154060] font-medium"}>{label}</a>)
      } else {
        nodes.push(<Link key={`link-${i}`} href={url} className={isUser ? "underline text-blue-200 hover:text-white" : "underline text-[#1B4F72] hover:text-[#154060] font-medium"}>{label}</Link>)
      }
      i++
    }
    i++
  }
  return nodes
}

// ─── Composant Message ────────────────────────────────────────────────────────

function MessageBubble({ message, onHide, hideLabel }: { message: Message; onHide?: () => void; hideLabel?: string }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex gap-2 items-start", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
        isUser ? "bg-[#1B4F72]" : "bg-gradient-to-br from-[#1e3a5f] to-[#0f172a]"
      )}>
        {isUser ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-[#38bdf8]" />}
      </div>
      <div className="flex flex-col gap-1 max-w-[82%]">
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-[#1B4F72] text-white rounded-tr-sm"
            : message.error
              ? "bg-red-50 text-red-700 border border-red-200 rounded-tl-sm"
              : "bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-sm"
        )}>
          {renderMarkdown(message.content, isUser)}
        </div>
        {message.timestamp && (
          <span className={cn("text-[10px] text-slate-400 px-1", isUser && "text-right")}>{message.timestamp}</span>
        )}
        {message.isWelcome && onHide && (
          <button onClick={onHide} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors self-start px-1 mt-0.5">
            <BellOff className="h-3 w-3" />
            {hideLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Widget principal ─────────────────────────────────────────────────────────

export function AIAssistant() {
  const locale = useLocale() as Locale
  const t = (key: keyof typeof AI_T) => AI_T[key][locale]

  const [hidden, setHidden] = useState(true)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null)

  const [pos, setPos] = useState({ x: 16, y: 96 })
  const posRef = useRef({ x: 16, y: 96 })
  const dragging = useRef(false)
  const dragStart = useRef({ px: 0, py: 0, x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const autoOpenedRef = useRef(false)
  const winDragActive = useRef(false)

  useEffect(() => {
    const isHidden = localStorage.getItem(HIDDEN_KEY) === "1"
    const isAutoOpenDisabled = localStorage.getItem(AUTO_OPEN_KEY) === "1"
    setHidden(isHidden)
    const handleOpenFromHeader = () => { setHidden(false); setOpen(true) }
    window.addEventListener("appo-ai-open", handleOpenFromHeader)
    return () => window.removeEventListener("appo-ai-open", handleOpenFromHeader)
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open, scrollToBottom])

  useEffect(() => {
    if (open && messages.length === 0) {
      const now = new Date().toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })
      setMessages([{ id: "welcome", role: "assistant", content: t("welcome"), isWelcome: true, timestamp: now }])
      const ctrl = new AbortController()
      const tid = setTimeout(() => ctrl.abort(), 8000)
      fetch("/api/ai/status", { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setOllamaAvailable(d.available === true))
        .catch(() => setOllamaAvailable(false))
        .finally(() => clearTimeout(tid))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messages.length])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  const handleHide = useCallback(() => {
    localStorage.setItem(HIDDEN_KEY, "1")
    setHidden(true)
    setOpen(false)
  }, [])

  useEffect(() => { posRef.current = pos }, [pos])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = false
    dragStart.current = { px: e.clientX, py: e.clientY, x: posRef.current.x, y: posRef.current.y }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const dx = e.clientX - dragStart.current.px
    const dy = e.clientY - dragStart.current.py
    if (!dragging.current && Math.abs(dx) + Math.abs(dy) > 4) dragging.current = true
    if (!dragging.current) return
    const newX = Math.max(8, Math.min(window.innerWidth - 44, dragStart.current.x - dx))
    const newY = Math.max(8, Math.min(window.innerHeight - 44, dragStart.current.y - dy))
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => { posRef.current = { x: newX, y: newY }; setPos({ x: newX, y: newY }) })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!dragging.current) setOpen((o) => !o)
    dragging.current = false
  }, [])

  const winDragStart = useRef({ px: 0, py: 0, x: 0, y: 0 })
  const winDragging = useRef(false)

  const onWinPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button,input,textarea,a,[data-messages]")) return
    e.preventDefault()
    winDragging.current = false
    winDragActive.current = true
    winDragStart.current = { px: e.clientX, py: e.clientY, x: posRef.current.x, y: posRef.current.y }

    const onMove = (ev: PointerEvent) => {
      if (!winDragActive.current) return
      const dx = ev.clientX - winDragStart.current.px
      const dy = ev.clientY - winDragStart.current.py
      if (!winDragging.current && Math.abs(dx) + Math.abs(dy) > 3) winDragging.current = true
      if (!winDragging.current) return
      const newX = Math.max(8, Math.min(window.innerWidth - 720, winDragStart.current.x - dx))
      const newY = Math.max(8, Math.min(window.innerHeight - 520 - 80, winDragStart.current.y - dy))
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => { posRef.current = { x: newX, y: newY }; setPos({ x: newX, y: newY }) })
    }
    const onUp = () => {
      winDragActive.current = false
      winDragging.current = false
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const now = new Date().toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: now }
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }])
    setInput("")
    setIsStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json()
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: err.error || t("connError2"), error: true } : m))
        return
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          const cur = accumulated
          setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: cur } : m))
        }
        const finishedAt = new Date().toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, timestamp: finishedAt } : m))
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: t("connError"), error: true } : m))
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, locale])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
  }

  const reset = () => { abortRef.current?.abort(); setMessages([]); setIsStreaming(false); setInput("") }

  if (hidden) return null

  return (
    <>
      {open && (
        <div
          className="fixed z-[9998] flex flex-row rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "#0a0a0f",
            right: pos.x,
            bottom: pos.y + 44 + 8,
            width: 720,
            height: 520,
            willChange: "transform",
            cursor: winDragActive.current ? "grabbing" : "grab",
          }}
          onPointerDown={onWinPointerDown}
        >
          {/* Colonne gauche */}
          <div
            className="flex flex-col items-center justify-between py-6 px-0 flex-shrink-0"
            style={{ width: 230, background: "#0a0a0f", boxShadow: "inset -1px 0 0 rgba(255,255,255,0.08)" }}
          >
            <div className="flex flex-col items-center gap-5 flex-1 justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/robot-appo-ia.png"
                alt="APPO-IA"
                style={{ width: "50%", height: "auto", display: "block", animation: "appoFloat 3s ease-in-out infinite" }}
              />
              <div className="text-center">
                <h2 className="text-white font-bold text-lg tracking-wide">{t("assistantName")}</h2>
                <p className="text-slate-400 text-[11px] mt-1.5 leading-snug text-center whitespace-pre-line">{t("subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <span className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                ollamaAvailable === null ? "bg-yellow-400 animate-pulse" :
                ollamaAvailable ? "bg-green-400 animate-pulse" : "bg-red-400"
              )} />
              <span className="text-[9px] font-semibold text-slate-300 tracking-widest uppercase">
                {ollamaAvailable === null ? t("connecting") : ollamaAvailable ? t("online") : t("offline")}
              </span>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="flex flex-col flex-1 bg-[#f4f7fb]" style={{ cursor: "default" }}>
            <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{t("headerTitle")}</h3>
                <p className="text-xs text-slate-400">{t("headerSub")}</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={reset} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100" title={t("reset")}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div data-messages className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 select-text">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} onHide={m.isWelcome ? handleHide : undefined} hideLabel={t("hideForever")} />
              ))}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-[#38bdf8]" />
                  </div>
                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                {SUGGESTIONS[locale].map((s) => (
                  <button key={s} onClick={() => sendMessage(s)} disabled={isStreaming}
                    className="text-[11px] bg-white border border-slate-200 hover:border-[#1B4F72]/40 hover:bg-[#EBF5FB] text-slate-500 hover:text-[#1B4F72] rounded-full px-3 py-1 transition-colors shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-slate-200 bg-white flex-shrink-0">
              <form onSubmit={handleSubmit} className="px-4 py-3 flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("placeholder")}
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 resize-none text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
                  style={{ minHeight: "24px" }}
                />
                <button type="submit" disabled={!input.trim() || isStreaming}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1B4F72] hover:bg-[#154060] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md">
                  {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              <p className="text-center text-[10px] text-slate-400 pb-2.5 px-4">{t("certified")}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn(
          "fixed z-[9999] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-shadow duration-200 touch-none select-none overflow-hidden",
          "bg-gradient-to-br from-[#1B4F72] to-[#0c1624] hover:shadow-2xl",
        )}
        style={{ right: pos.x, bottom: pos.y, willChange: "transform" }}
        title="Assistant IA APPO"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/robot-appo-ia.png" alt="APPO-IA" style={{ width: "78%", height: "78%", objectFit: "contain", display: "block" }} />
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
      </button>
    </>
  )
}
