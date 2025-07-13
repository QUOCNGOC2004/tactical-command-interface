import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import TacticalDashboard from "@/tactical-dashboard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MEDISAFE - Tủ thuốc thông minh",
  description: "Hệ thống quản lý tủ thuốc thông minh cho bệnh viện",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <TacticalDashboard>{children}</TacticalDashboard>
      </body>
    </html>
  )
}
