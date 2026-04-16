import type { Metadata } from "next"
import { Inter } from "next/font/google"
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
