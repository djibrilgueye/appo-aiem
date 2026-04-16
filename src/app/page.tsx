"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  ArrowRight, Users, Globe2, Loader2, Mail, KeyRound, ShieldCheck,
  CheckCircle2, ArrowLeft, ChevronRight, BookOpen, Droplets,
  TrendingUp, BarChart2, ChevronDown, GraduationCap, FlaskConical,
  Warehouse, Atom, Zap,
} from "lucide-react"
import { useLanguage } from "@/i18n/LanguageContext"
import type { Lang } from "@/i18n/translations"

// ─── Icônes personnalisées ────────────────────────────────────────────────────
function OilBarrelIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* Corps du baril */}
      <ellipse cx="12" cy="5" rx="7" ry="2.5" />
      <ellipse cx="12" cy="19" rx="7" ry="2.5" />
      <line x1="5" y1="5" x2="5" y2="19" />
      <line x1="19" y1="5" x2="19" y2="19" />
      {/* Cerclages */}
      <path d="M5 9 Q12 11 19 9" />
      <path d="M5 15 Q12 17 19 15" />
      {/* Étiquette */}
      <line x1="8" y1="12" x2="16" y2="12" strokeWidth={1.2} />
    </svg>
  )
}

function GasFlameIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" stroke="none">
      <path fill="#fbbf24" d="M12 2C12 2 8 7 8 11c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-1-3-1-3s-.5 2-1.5 2.5C13 9 12 2 12 2z" opacity="0.95"/>
      <path fill="#fbbf24" d="M7 17c0-2.8 2.2-5 5-5s5 2.2 5 5c0 2.2-1.8 4-5 4s-5-1.8-5-4z" opacity="0.75"/>
      <path fill="white" d="M12 14c0 0-1.5 1.5-1.5 3s.7 2 1.5 2 1.5-.7 1.5-2S12 14 12 14z" opacity="0.5"/>
    </svg>
  )
}

// ─── Globe 3D (react-globe.gl, SSR désactivé) ────────────────────────────────
const GlobeAIEM = dynamic(() => import("@/components/GlobeAIEM"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 60% 50%, #daeaf7 0%, #eaf3fb 55%, #f0f6fc 100%)" }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#F4B942" }} />
    </div>
  ),
})

// ─── Membres APPO ─────────────────────────────────────────────────────────────
const APPO_MEMBERS = ["DZ","AO","BJ","CM","CG","CD","CI","EG","GQ","GA","GH","LY","NA","NE","NG","SN","ZA","TD"]

const COUNTRY_INFO: Record<string, {
  fr: string; en: string; es: string; pt: string; ar: string
  capital: string; population: string; surface: string
  oil: { fr: string; en: string; es: string; pt: string; ar: string }
}> = {
  DZ: { fr: "Algérie",        en: "Algeria",      es: "Argelia",        pt: "Argélia",        ar: "الجزائر",
        capital: "Alger",        population: "45M",  surface: "2 382 000 km²",
        oil: { fr: "Producteur majeur GNL", en: "Major LNG producer", es: "Gran productor GNL", pt: "Grande produtor GNL", ar: "منتج رئيسي للغاز الطبيعي المسال" } },
  AO: { fr: "Angola",         en: "Angola",       es: "Angola",         pt: "Angola",          ar: "أنغولا",
        capital: "Luanda",       population: "35M",  surface: "1 247 000 km²",
        oil: { fr: "2e producteur africain", en: "2nd African producer", es: "2.° productor africano", pt: "2.° produtor africano", ar: "ثاني منتج أفريقي" } },
  BJ: { fr: "Bénin",          en: "Benin",        es: "Benín",          pt: "Benin",           ar: "بنين",
        capital: "Cotonou",      population: "13M",  surface: "115 000 km²",
        oil: { fr: "Producteur émergent", en: "Emerging producer", es: "Productor emergente", pt: "Produtor emergente", ar: "منتج ناشئ" } },
  CM: { fr: "Cameroun",       en: "Cameroon",     es: "Camerún",        pt: "Camarões",        ar: "الكاميرون",
        capital: "Yaoundé",      population: "28M",  surface: "475 000 km²",
        oil: { fr: "Producteur régional", en: "Regional producer", es: "Productor regional", pt: "Produtor regional", ar: "منتج إقليمي" } },
  CG: { fr: "Rép. du Congo",  en: "Congo",        es: "Congo",          pt: "Congo",           ar: "الكونغو",
        capital: "Brazzaville",  population: "6M",   surface: "342 000 km²",
        oil: { fr: "Producteur important", en: "Significant producer", es: "Productor importante", pt: "Produtor importante", ar: "منتج مهم" } },
  CD: { fr: "RD Congo",       en: "DR Congo",     es: "RD Congo",       pt: "RD Congo",        ar: "الكونغو الديمقراطية",
        capital: "Kinshasa",     population: "100M", surface: "2 345 000 km²",
        oil: { fr: "Potentiel offshore", en: "Offshore potential", es: "Potencial costa afuera", pt: "Potencial offshore", ar: "إمكانات بحرية" } },
  CI: { fr: "Côte d'Ivoire",  en: "Ivory Coast",  es: "Costa de Marfil", pt: "Costa do Marfim", ar: "ساحل العاج",
        capital: "Abidjan",      population: "27M",  surface: "323 000 km²",
        oil: { fr: "Production offshore", en: "Offshore production", es: "Producción costa afuera", pt: "Produção offshore", ar: "إنتاج بحري" } },
  EG: { fr: "Égypte",         en: "Egypt",        es: "Egipto",         pt: "Egito",           ar: "مصر",
        capital: "Le Caire",     population: "105M", surface: "1 001 000 km²",
        oil: { fr: "1er producteur N. Afrique", en: "1st N. Africa producer", es: "1.° productor N. África", pt: "1.° produtor N. África", ar: "أول منتج في شمال أفريقيا" } },
  GQ: { fr: "Guinée équat.",  en: "Eq. Guinea",   es: "Guinea Ecuatorial", pt: "Guiné Equatorial", ar: "غينيا الاستوائية",
        capital: "Malabo",       population: "1.5M", surface: "28 000 km²",
        oil: { fr: "Riche en hydrocarbures", en: "Rich in hydrocarbons", es: "Rico en hidrocarburos", pt: "Rico em hidrocarbonetos", ar: "غني بالهيدروكربونات" } },
  GA: { fr: "Gabon",          en: "Gabon",        es: "Gabón",          pt: "Gabão",           ar: "الغابون",
        capital: "Libreville",   population: "2.3M", surface: "268 000 km²",
        oil: { fr: "Producteur historique", en: "Historic producer", es: "Productor histórico", pt: "Produtor histórico", ar: "منتج تاريخي" } },
  GH: { fr: "Ghana",          en: "Ghana",        es: "Ghana",          pt: "Gana",            ar: "غانا",
        capital: "Accra",        population: "33M",  surface: "239 000 km²",
        oil: { fr: "Offshore Jubilee Field", en: "Jubilee Field offshore", es: "Campo Jubilee costa afuera", pt: "Campo Jubilee offshore", ar: "حقل جوبيلي البحري" } },
  LY: { fr: "Libye",          en: "Libya",        es: "Libia",          pt: "Líbia",           ar: "ليبيا",
        capital: "Tripoli",      population: "7M",   surface: "1 760 000 km²",
        oil: { fr: "1ères réserves africaines", en: "Largest African reserves", es: "Mayores reservas africanas", pt: "Maiores reservas africanas", ar: "أكبر احتياطيات أفريقية" } },
  NA: { fr: "Namibie",        en: "Namibia",      es: "Namibia",        pt: "Namíbia",         ar: "ناميبيا",
        capital: "Windhoek",     population: "2.6M", surface: "825 000 km²",
        oil: { fr: "Découvertes majeures 2022", en: "Major discoveries 2022", es: "Descubrimientos mayores 2022", pt: "Grandes descobertas 2022", ar: "اكتشافات كبرى 2022" } },
  NE: { fr: "Niger",          en: "Niger",        es: "Níger",          pt: "Níger",           ar: "النيجر",
        capital: "Niamey",       population: "25M",  surface: "1 267 000 km²",
        oil: { fr: "Pipeline vers Bénin", en: "Pipeline to Benin", es: "Oleoducto hacia Benín", pt: "Oleoduto para o Benin", ar: "خط أنابيب نحو بنين" } },
  NG: { fr: "Nigéria",        en: "Nigeria",      es: "Nigeria",        pt: "Nigéria",         ar: "نيجيريا",
        capital: "Abuja",        population: "220M", surface: "924 000 km²",
        oil: { fr: "1er producteur africain", en: "1st African producer", es: "1.° productor africano", pt: "1.° produtor africano", ar: "أول منتج أفريقي" } },
  SN: { fr: "Sénégal",        en: "Senegal",      es: "Senegal",        pt: "Senegal",         ar: "السنغال",
        capital: "Dakar",        population: "17M",  surface: "197 000 km²",
        oil: { fr: "Gisements GNL offshore", en: "Offshore LNG fields", es: "Campos GNL costa afuera", pt: "Campos GNL offshore", ar: "حقول الغاز الطبيعي المسال البحرية" } },
  ZA: { fr: "Afrique du Sud", en: "South Africa", es: "Sudáfrica",      pt: "África do Sul",   ar: "جنوب أفريقيا",
        capital: "Pretoria",     population: "60M",  surface: "1 221 000 km²",
        oil: { fr: "Raffinage & gaz naturel", en: "Refining & natural gas", es: "Refinación & gas natural", pt: "Refinação & gás natural", ar: "تكرير وغاز طبيعي" } },
  TD: { fr: "Tchad",          en: "Chad",         es: "Chad",           pt: "Chade",           ar: "تشاد",
        capital: "N'Djamena",    population: "17M",  surface: "1 284 000 km²",
        oil: { fr: "Pipeline Tchad-Cameroun", en: "Chad-Cameroon pipeline", es: "Oleoducto Chad-Camerún", pt: "Oleoduto Chade-Camarões", ar: "خط أنابيب تشاد-الكاميرون" } },
}

// ─── Traductions inline ───────────────────────────────────────────────────────
const T = {
  badge:       { fr: "Accès sécurisé OTP",      en: "Secure OTP Access",      es: "Acceso OTP seguro",       pt: "Acesso OTP seguro",       ar: "وصول آمن بـ OTP" },
  step1Title:  { fr: "Connexion",                en: "Sign In",                es: "Iniciar sesión",          pt: "Entrar",                  ar: "تسجيل الدخول" },
  step2Title:  { fr: "Vérification",             en: "Verification",           es: "Verificación",            pt: "Verificação",             ar: "التحقق" },
  step1Sub:    { fr: "Entrez votre email pour recevoir votre code de connexion", en: "Enter your email to receive your sign-in code", es: "Ingrese su email para recibir su código", pt: "Insira seu email para receber o código", ar: "أدخل بريدك الإلكتروني للحصول على رمز الدخول" },
  codeSentTo:  { fr: "Code envoyé à",            en: "Code sent to",           es: "Código enviado a",        pt: "Código enviado para",     ar: "تم إرسال الرمز إلى" },
  emailLabel:  { fr: "Adresse email",            en: "Email address",          es: "Correo electrónico",      pt: "Endereço de email",       ar: "البريد الإلكتروني" },
  emailPh:     { fr: "votre@email.com",          en: "your@email.com",         es: "su@correo.com",           pt: "seu@email.com",           ar: "بريدك@email.com" },
  emailInfo:   { fr: "Un code à 6 chiffres valable 5 minutes sera envoyé à votre adresse email.", en: "A 6-digit code valid for 5 minutes will be sent to your email.", es: "Se enviará un código de 6 dígitos válido por 5 minutos a su email.", pt: "Um código de 6 dígitos válido por 5 minutos será enviado ao seu email.", ar: "سيُرسَل رمز مكوّن من 6 أرقام صالح لمدة 5 دقائق إلى بريدك." },
  sendBtn:     { fr: "Recevoir le code",         en: "Receive code",           es: "Recibir código",          pt: "Receber código",          ar: "استلام الرمز" },
  codeLabel:   { fr: "Code à 6 chiffres",        en: "6-digit code",           es: "Código de 6 dígitos",     pt: "Código de 6 dígitos",     ar: "رمز مكون من 6 أرقام" },
  codeExpiry:  { fr: "Ce code expire dans 5 minutes", en: "This code expires in 5 minutes", es: "Este código expira en 5 minutos", pt: "Este código expira em 5 minutos", ar: "ينتهي هذا الرمز خلال 5 دقائق" },
  verifyBtn:   { fr: "Vérifier & Accéder",       en: "Verify & Access",        es: "Verificar & Acceder",     pt: "Verificar & Acessar",     ar: "تحقق ودخول" },
  changeEmail: { fr: "Changer d'adresse email",  en: "Change email address",   es: "Cambiar email",           pt: "Alterar email",           ar: "تغيير البريد الإلكتروني" },
  errorSend:   { fr: "Erreur lors de l'envoi",   en: "Error sending the code", es: "Error al enviar el código", pt: "Erro ao enviar o código", ar: "خطأ في الإرسال" },
  errorVerify: { fr: "Erreur lors de la vérification", en: "Verification error", es: "Error de verificación", pt: "Erro de verificação", ar: "خطأ في التحقق" },
  errorInvalid:{ fr: "Code invalide ou expiré",  en: "Invalid or expired code", es: "Código inválido o expirado", pt: "Código inválido ou expirado", ar: "رمز غير صالح أو منتهي الصلاحية" },
  footerText:  { fr: "Accès réservé aux membres autorisés.", en: "Access restricted to authorized members.", es: "Acceso restringido a miembros autorizados.", pt: "Acesso restrito a membros autorizados.", ar: "الوصول مقتصر على الأعضاء المخوّلين." },
  tagline:     { fr: "Africa Interactive Energy Map", en: "Africa Interactive Energy Map", es: "Africa Interactive Energy Map", pt: "Africa Interactive Energy Map", ar: "خريطة أفريقيا التفاعلية للطاقة" },
  desc:        { fr: "Carte interactive de l'énergie en Afrique — bassins sédimentaires, réserves et production d'hydrocarbures, pipelines, raffineries et plus.", en: "Interactive map of Africa's energy sector — sedimentary basins, oil & gas reserves and production, pipelines, refineries, and more.", es: "Mapa interactivo del sector energético africano — cuencas sedimentarias, reservas y producción de hidrocarburos, oleoductos, refinerías y más.", pt: "Mapa interativo do setor energético africano — bacias sedimentares, reservas e produção de hidrocarbonetos, oleodutos, refinarias e mais.", ar: "خريطة تفاعلية لقطاع الطاقة في أفريقيا — الأحواض الرسوبية واحتياطيات وإنتاج الهيدروكربونات والخطوط والمصافي والمزيد." },
  membersLbl:   { fr: "Pays membres",    en: "Member countries",  es: "Países miembros",   pt: "Países membros",    ar: "الدول الأعضاء" },
  basinsLbl:    { fr: "Bassins",         en: "Basins",            es: "Cuencas",           pt: "Bacias",            ar: "الأحواض" },
  pipelinesLbl: { fr: "Pipelines",       en: "Pipelines",         es: "Oleoductos",        pt: "Oleodutos",         ar: "خطوط الأنابيب" },
  refineriesLbl:{ fr: "Raffineries",     en: "Refineries",        es: "Refinerías",        pt: "Refinarias",        ar: "المصافي" },
  trainingLbl:  { fr: "Formation",       en: "Training",          es: "Formación",         pt: "Formação",          ar: "التدريب" },
  rndLbl:       { fr: "R&D",            en: "R&D",               es: "I+D",               pt: "I&D",               ar: "البحث والتطوير" },
  storageLbl:   { fr: "Stockage",        en: "Storage",           es: "Almacenamiento",    pt: "Armazenamento",     ar: "التخزين" },
  petrochemLbl: { fr: "Pétrochimie",     en: "Petrochemicals",    es: "Petroquímica",      pt: "Petroquímica",      ar: "البتروكيماويات" },
  reservesLbl:  { fr: "Réserves",        en: "Reserves",          es: "Reservas",          pt: "Reservas",          ar: "الاحتياطيات" },
  productionLbl:{ fr: "Production",      en: "Production",        es: "Producción",        pt: "Produção",          ar: "الإنتاج" },
  infoTitle:   { fr: "Informations Pays",  en: "Country Info",     es: "Info País",      pt: "Info País",      ar: "معلومات الدولة" },
  memberTab:   { fr: "Pays Membres",       en: "Member Countries", es: "Países Miembros", pt: "Países Membros", ar: "الدول الأعضاء" },
  selectMsg:   { fr: "Sélectionnez un pays", en: "Select a country", es: "Seleccione un país", pt: "Selecione um país", ar: "اختر دولة" },
  selectSub:   { fr: "Cliquez sur un pays de la carte pour afficher ses informations.", en: "Click on a country on the map to display its information.", es: "Haga clic en un país en el mapa para ver su información.", pt: "Clique em um país no mapa para ver suas informações.", ar: "انقر على دولة في الخريطة لعرض معلوماتها." },
  memberLegend:{ fr: "Membre APPO",  en: "APPO Member",  es: "Miembro APPO",  pt: "Membro APPO",  ar: "عضو APPO" },
  otherLegend: { fr: "Autre pays",   en: "Other country", es: "Otro país",    pt: "Outro país",   ar: "دولة أخرى" },
  capital:     { fr: "Capitale",     en: "Capital",      es: "Capital",       pt: "Capital",      ar: "العاصمة" },
  population:  { fr: "Population",   en: "Population",   es: "Población",     pt: "População",    ar: "السكان" },
  surface:     { fr: "Superficie",   en: "Area",         es: "Superficie",    pt: "Superfície",   ar: "المساحة" },
  oilGas:      { fr: "Pétrole & Gaz", en: "Oil & Gas",  es: "Petróleo & Gas", pt: "Petróleo & Gás", ar: "النفط والغاز" },
  notMember:   { fr: "Ce pays n'est pas membre de l'APPO", en: "This country is not an APPO member", es: "Este país no es miembro de la OPPA", pt: "Este país não é membro da APPO", ar: "هذه الدولة ليست عضوًا في APPO" },
  openMap:     { fr: "Accéder à la carte complète", en: "Open full map", es: "Abrir mapa completo", pt: "Abrir mapa completo", ar: "فتح الخريطة الكاملة" },
}

// ─── Sélecteur de langue ───────────────────────────────────────────────────────
const LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
]

export default function LandingPage() {
  const router = useRouter()
  const { lang, setLang } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Stats
  const [stats, setStats] = useState({ countries: 0, basins: 0, pipelines: 0, refineries: 0, training: 0, rnd: 0, storage: 0, petrochem: 0, reserves: 0, production: 0 })

  // Auth
  const [step, setStep] = useState<"email" | "code">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")

  // Pays sélectionné
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"info" | "members">("info")

  const t = useCallback((key: keyof typeof T) => T[key][lang] ?? T[key]["fr"], [lang])
  const isRtl = lang === "ar"

  // Click-outside langue
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Stats
  useEffect(() => {
    Promise.all([
      fetch("/api/countries").then(r => r.json()).catch(() => []),
      fetch("/api/basins?all=1").then(r => r.json()).catch(() => []),
      fetch("/api/pipelines").then(r => r.json()).catch(() => []),
      fetch("/api/refineries").then(r => r.json()).catch(() => []),
      fetch("/api/training").then(r => r.json()).catch(() => []),
      fetch("/api/rnd").then(r => r.json()).catch(() => []),
      fetch("/api/storage").then(r => r.json()).catch(() => []),
      fetch("/api/petrochem").then(r => r.json()).catch(() => []),
      fetch("/api/reserves").then(r => r.json()).catch(() => []),
      fetch("/api/production").then(r => r.json()).catch(() => []),
    ]).then(([countries, basins, pipelines, refineries, training, rnd, storage, petrochem, reserves, production]) => {
      setStats({
        countries:  Array.isArray(countries)   ? countries.length  : 0,
        basins:     Array.isArray(basins)       ? basins.length     : 0,
        pipelines:  Array.isArray(pipelines)    ? pipelines.length  : 0,
        refineries: Array.isArray(refineries)   ? refineries.length : 0,
        training:   Array.isArray(training)     ? training.length   : 0,
        rnd:        Array.isArray(rnd)          ? rnd.length        : 0,
        storage:    Array.isArray(storage)      ? storage.length    : 0,
        petrochem:  Array.isArray(petrochem)    ? petrochem.length  : 0,
        reserves:   Array.isArray(reserves)     ? new Set(reserves.map((r: { countryId?: string }) => r.countryId)).size : 0,
        production: Array.isArray(production)   ? new Set(production.map((p: { countryId?: string }) => p.countryId)).size : 0,
      })
    })
  }, [])

  // OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true); setAuthError("")
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setAuthError(data.error || t("errorSend")); return }
      setStep("code")
    } catch { setAuthError(t("errorSend")) }
    finally { setIsLoading(false) }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true); setAuthError("")
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      })
      const data = await res.json()
      if (!res.ok) { setAuthError(data.error || t("errorInvalid")); return }
      // Use NextAuth signIn with proof token
      const { signIn, getSession } = await import("next-auth/react")
      const result = await signIn("credentials", {
        redirect: false,
        email,
        otpProofToken: data.otpProofToken,
      })
      if (result?.ok) {
        // Wait for the session cookie to be written before navigating
        let session = null
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 300))
          session = await getSession()
          if (session) break
        }
        const params = new URLSearchParams(window.location.search)
        const dest = params.get("callbackUrl") || "/app"
        window.location.href = dest
      } else {
        setAuthError(result?.error || t("errorVerify"))
      }
    } catch { setAuthError(t("errorVerify")) }
    finally { setIsLoading(false) }
  }

  const country = selectedCountry ? COUNTRY_INFO[selectedCountry] : null
  const isAppo = selectedCountry ? APPO_MEMBERS.includes(selectedCountry) : false
  const currentLang = LANG_OPTIONS.find(l => l.code === lang) ?? LANG_OPTIONS[0]

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      dir={isRtl ? "rtl" : "ltr"}
      style={{ backgroundColor: "#f0f4f8" }}
    >

      {/* ══════════ COLONNE GAUCHE — Connexion ══════════ */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-sm overflow-y-auto" style={{ order: isRtl ? 3 : 1 }}>

        {/* Header logo + langue */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/appo_logo.jpeg" alt="APPO" className="h-10 w-10 rounded object-contain" />
              <div>
                <p className="font-bold text-base leading-tight" style={{ color: "#1B4F72" }}>AIEM</p>
                <p className="text-[10px] text-slate-400">Africa Interactive Energy Map</p>
              </div>
            </div>
            {/* Sélecteur langue */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", color: "#1B4F72", cursor: "pointer" }}
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.code.toUpperCase()}</span>
                <ChevronDown size={11} style={{ transform: langOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {langOpen && (
                <div className="absolute top-full mt-1 rounded-lg overflow-hidden z-50"
                  style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: "140px", right: isRtl ? "auto" : 0, left: isRtl ? 0 : "auto" }}>
                  {LANG_OPTIONS.map(opt => (
                    <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs transition-colors"
                      style={{ backgroundColor: lang === opt.code ? "#eff6ff" : "transparent", color: lang === opt.code ? "#1B4F72" : "#475569", fontWeight: lang === opt.code ? "bold" : "normal", border: "none", cursor: "pointer", direction: opt.code === "ar" ? "rtl" : "ltr" }}>
                      <span>{opt.flag}</span>
                      <span>{opt.label}</span>
                      {lang === opt.code && <span style={{ marginLeft: "auto", color: "#1B4F72" }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-4">

          {/* Badge + titre */}
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#eff6ff", color: "#1B4F72" }}>
              <ShieldCheck className="h-3 w-3" />
              {t("badge")}
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#0D2840" }}>
              {step === "email" ? t("step1Title") : t("step2Title")}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {step === "email"
                ? t("step1Sub")
                : <>{t("codeSentTo")} <strong style={{ color: "#1B4F72" }}>{email}</strong></>
              }
            </p>
          </div>

          {/* Indicateur étapes */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: step === "email" ? "#1B4F72" : "#22c55e", color: "#fff" }}>
              {step === "email" ? "1" : <CheckCircle2 className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: step === "code" ? "#22c55e" : "#e2e8f0" }} />
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: step === "code" ? "#1B4F72" : "#e2e8f0", color: step === "code" ? "#fff" : "#94a3b8" }}>
              2
            </div>
          </div>

          {/* Étape 1 : Email */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-3">
              {authError && (
                <div className="text-xs text-red-600 rounded-lg p-2.5" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>⚠ {authError}</div>
              )}
              <div className="text-[11px] text-slate-500 rounded-lg p-2.5 flex gap-2"
                style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <Mail className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#1B4F72" }} />
                {t("emailInfo")}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">{t("emailLabel")}</label>
                <input type="email" placeholder={t("emailPh")}
                  value={email} onChange={e => setEmail(e.target.value)}
                  required disabled={isLoading} autoComplete="email"
                  className="w-full h-10 px-3 text-sm rounded-xl outline-none transition-all"
                  style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff" }}
                  onFocus={e => e.target.style.borderColor = "#1B4F72"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
              <button type="submit" disabled={isLoading || !email}
                className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: "#1B4F72", color: "#fff", cursor: isLoading || !email ? "not-allowed" : "pointer", opacity: !email ? 0.6 : 1 }}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {t("sendBtn")}
              </button>
            </form>
          )}

          {/* Étape 2 : OTP */}
          {step === "code" && (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-3">
              {authError && (
                <div className="text-xs text-red-600 rounded-lg p-2.5" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>⚠ {authError}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">{t("codeLabel")}</label>
                <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  placeholder="• • • • • •" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required disabled={isLoading} autoComplete="one-time-code" autoFocus
                  className="w-full h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-xl outline-none transition-all"
                  style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff" }}
                  onFocus={e => e.target.style.borderColor = "#1B4F72"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <p className="text-[11px] text-slate-400">{t("codeExpiry")}</p>
              </div>
              <button type="submit" disabled={isLoading || code.length !== 6}
                className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: "#1B4F72", color: "#fff", cursor: isLoading || code.length !== 6 ? "not-allowed" : "pointer", opacity: code.length !== 6 ? 0.6 : 1 }}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {t("verifyBtn")}
              </button>
              <button type="button" onClick={() => { setStep("email"); setCode(""); setAuthError("") }}
                className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer" }}>
                <ArrowLeft className="h-3 w-3" />
                {t("changeEmail")}
              </button>
            </form>
          )}

          {/* Bouton carte publique */}
          <div className="mt-auto pt-3 border-t border-slate-100">
            <Link href="/app"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#1B4F72" }}>
              <Globe2 className="h-3.5 w-3.5" />
              {t("openMap")}
              <ArrowRight className="h-3 w-3 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            {t("footerText")}<br />
            <a href="mailto:info@apposecretariat.org" style={{ color: "#1B4F72" }}>info@apposecretariat.org</a>
          </p>
        </div>
      </div>

      {/* ══════════ COLONNE CENTRE — Stats + Infos pays ══════════ */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 overflow-y-auto" style={{ order: 2 }}>

        {/* Bloc descriptif */}
        <div className="p-5 border-b border-slate-200" style={{ backgroundColor: "rgba(255,255,255,0.7)" }}>
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: "#1B4F72" }}>
            {t("tagline")}
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">{t("desc")}</p>

          {/* Stats */}
          <div className="flex flex-col gap-1.5 mt-3">
            {/* Ligne 1 : Pays membres pleine largeur */}
            <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2"
              style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <Globe2 className="h-4 w-4" style={{ color: "#1B4F72" }} />
              <div className="text-lg font-bold leading-none" style={{ color: "#1B4F72" }}>{APPO_MEMBERS.length}</div>
              <div className="text-[10px] font-semibold text-center" style={{ color: "#1B4F72" }}>{t("membersLbl")}</div>
            </div>
            {/* Lignes 2-4 : 9 autres en grille 3×3 */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: stats.basins,      label: t("basinsLbl"),     icon: Layers2,       bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
                { value: stats.pipelines,   label: t("pipelinesLbl"),  icon: TrendingUp,    bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
                { value: stats.refineries,  label: t("refineriesLbl"), icon: BarChart2,     bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
                { value: stats.training,    label: t("trainingLbl"),   icon: GraduationCap, bg: "#f0fdf4", text: "#166534", border: "#86efac" },
                { value: stats.rnd,         label: t("rndLbl"),        icon: FlaskConical,  bg: "#fef9c3", text: "#854d0e", border: "#fde68a" },
                { value: stats.storage,     label: t("storageLbl"),    icon: Warehouse,     bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
                { value: stats.petrochem,   label: t("petrochemLbl"),  icon: Atom,            bg: "#fdf2f8", text: "#86198f", border: "#f5d0fe" },
                { value: stats.reserves,    label: t("reservesLbl"),   icon: OilBarrelIcon,   bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
                { value: stats.production,  label: t("productionLbl"), icon: GasFlameIcon,    bg: "#fefce8", text: "#a16207", border: "#fbbf24" },
              ].map(({ value, label, icon: Icon, bg, text, border }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 rounded-lg p-1.5"
                  style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                  <Icon className="h-3 w-3" style={{ color: text }} />
                  <div className="text-base font-bold leading-none" style={{ color: text }}>{value}</div>
                  <div className="text-[9px] text-center leading-tight" style={{ color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Onglets infos pays */}
        <div className="flex flex-col flex-1" style={{ backgroundColor: "rgba(255,255,255,0.5)" }}>
          <div className="flex border-b border-slate-200 flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.8)" }}>
            <button onClick={() => setActiveTab("info")}
              className="flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              style={{ color: activeTab === "info" ? "#1B4F72" : "#94a3b8", background: "none", border: "none", borderBottom: activeTab === "info" ? "2px solid #1B4F72" : "2px solid transparent", cursor: "pointer" }}>
              <BookOpen className="h-3 w-3" />
              {t("infoTitle")}
            </button>
            <button onClick={() => setActiveTab("members")}
              className="flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              style={{ color: activeTab === "members" ? "#1B4F72" : "#94a3b8", background: "none", border: "none", cursor: "pointer", borderBottom: activeTab === "members" ? "2px solid #1B4F72" : "2px solid transparent" }}>
              <Users className="h-3 w-3" />
              {APPO_MEMBERS.length} {t("memberTab")}
            </button>
          </div>

          {/* Onglet Info */}
          {activeTab === "info" && (
            <div className="flex-1">
              {!selectedCountry ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center h-full min-h-[200px]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                    <Globe2 className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{t("selectMsg")}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{t("selectSub")}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#1B4F72" }} />
                      <span className="text-slate-500 text-[11px]">{t("memberLegend")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-slate-300" />
                      <span className="text-slate-400 text-[11px]">{t("otherLegend")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: isAppo ? "#1B4F72" : "#cbd5e1" }}>
                      {selectedCountry}
                    </div>
                    <div>
                      <div className="text-slate-800 font-bold text-sm">
                        {country?.[lang as keyof typeof country] as string ?? country?.fr ?? ""}
                      </div>
                      {isAppo && (
                        <div className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#1B4F72" }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#1B4F72" }} />
                          {t("memberLegend")}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isAppo ? (
                    <p className="text-slate-400 text-xs italic">{t("notMember")}</p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        {[
                          { label: t("capital"),    value: country?.capital },
                          { label: t("population"), value: country?.population },
                          { label: t("surface"),    value: country?.surface },
                          { label: t("oilGas"),     value: country?.oil?.[lang as keyof typeof country.oil] ?? country?.oil?.fr },
                        ].map(({ label, value }) => value && (
                          <div key={label} className="flex items-start gap-2 rounded-lg px-3 py-1.5"
                            style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                            <span className="text-slate-400 text-[11px] w-20 flex-shrink-0">{label}</span>
                            <span className="text-slate-700 text-[11px] font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                      <Link href="/app?view=map"
                        className="flex items-center justify-between w-full py-2 px-3 rounded-lg text-white text-xs font-medium shadow-sm transition-all"
                        style={{ backgroundColor: "#1B4F72" }}>
                        {t("openMap")}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Onglet Membres */}
          {activeTab === "members" && (
            <div className="flex-1 overflow-y-auto py-1">
              {APPO_MEMBERS.map(iso2 => {
                const info = COUNTRY_INFO[iso2]
                return (
                  <button key={iso2} onClick={() => { setSelectedCountry(iso2); setActiveTab("info") }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left transition-all"
                    style={{
                      backgroundColor: selectedCountry === iso2 ? "#eff6ff" : "transparent",
                      borderLeft: selectedCountry === iso2 ? "2px solid #1B4F72" : "2px solid transparent",
                      cursor: "pointer", border: "none",
                    }}>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: "#1B4F72" }}>{iso2}</div>
                    <span className="text-slate-600 text-xs">
                      {info?.[lang as keyof typeof info] as string ?? info?.fr ?? iso2}
                    </span>
                    {selectedCountry === iso2 && <ChevronRight className="h-3 w-3 ml-auto" style={{ color: "#1B4F72" }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ COLONNE DROITE — Globe 3D ══════════ */}
      <div className="flex-1 relative overflow-hidden" style={{ order: isRtl ? 1 : 3, background: "radial-gradient(ellipse at 60% 50%, #daeaf7 0%, #eaf3fb 55%, #f0f6fc 100%)" }}>
        <GlobeAIEM
          selectedCountry={selectedCountry}
          onSelectCountry={(iso2) => { setSelectedCountry(iso2); setActiveTab("info") }}
        />
        {/* Bouton accès carte complète */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Link href="/app"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#1B4F72", color: "#fff", border: "2px solid #F4B942" }}>
            <Globe2 className="h-4 w-4" />
            {t("openMap")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {/* Badge */}
        <div className="absolute top-4 right-4 z-[1000] px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", color: "#1B4F72", border: "1px solid #D0E4F0", boxShadow: "0 2px 8px rgba(27,79,114,0.1)" }}>
          APPO © 2026
        </div>
      </div>

    </div>
  )
}

// Icône manquante dans lucide pour les couches
function Layers2({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
}
