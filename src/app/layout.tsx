import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

// Explicit viewport so kiosk / tablet browsers lay the page out at the real
// screen width instead of a scaled "desktop" viewport, and so 100dvh maps to
// the visible area (toolbars excluded).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}
import "./globals.css"
import { Providers } from "@/components/Providers"
import { LanguageProvider } from "@/i18n/LanguageContext"
import { AIProvider } from "@/components/AIProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AIEM - Africa Interactive Energy Map",
  description: "Interactive map showing oil and gas infrastructure across Africa",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <LanguageProvider>
            <AIProvider>
              {children}
            </AIProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  )
}
