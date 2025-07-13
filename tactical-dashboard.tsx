"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Activity,
  Users,
  Pill,
  Heart,
  Droplets,
  AlertTriangle,
  Calendar,
  Database,
  Menu,
  X,
  Shield,
  Monitor,
} from "lucide-react"

const navigation = [
  {
    name: "Tổng quan",
    href: "/",
    icon: Monitor,
    description: "Dashboard tổng quan hệ thống",
  },
  {
    name: "Tủ thuốc",
    href: "/medicine-cabinet",
    icon: Pill,
    description: "Quản lý tủ thuốc thông minh",
  },
  {
    name: "Theo dõi sức khỏe",
    href: "/health-monitor",
    icon: Heart,
    description: "Giám sát sinh hiệu bệnh nhân",
  },
  {
    name: "Hệ thống nước",
    href: "/water-system",
    icon: Droplets,
    description: "Quản lý hệ thống cung cấp nước",
  },
  {
    name: "Khẩn cấp",
    href: "/emergency",
    icon: AlertTriangle,
    description: "Hệ thống gọi khẩn cấp",
  },
  {
    name: "Bệnh nhân",
    href: "/patients",
    icon: Users,
    description: "Quản lý thông tin bệnh nhân",
  },
  {
    name: "Quản lý thuốc",
    href: "/medications",
    icon: Database,
    description: "Quản lý kho thuốc và loại thuốc",
  },
  {
    name: "Lịch trình thuốc",
    href: "/schedules",
    icon: Calendar,
    description: "Lịch trình uống thuốc bệnh nhân",
  },
]

export default function TacticalDashboard({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-neutral-900 border-r border-neutral-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-neutral-700 px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wider text-white">MEDISAFE</h1>
                <p className="text-xs text-neutral-400">Tủ thuốc thông minh</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-neutral-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-neutral-800",
                    isActive
                      ? "bg-orange-500/20 text-orange-500 border border-orange-500/30"
                      : "text-neutral-300 hover:text-white",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-orange-500" : "text-neutral-400")} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-neutral-500">{item.description}</div>
                  </div>
                  {isActive && <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                </Link>
              )
            })}
          </nav>

          {/* System Status */}
          <div className="border-t border-neutral-700 p-4">
            <Card className="bg-neutral-800 border-neutral-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-400 tracking-wider">TRẠNG THÁI HỆ THỐNG</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs text-white font-medium">HOẠT ĐỘNG</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tủ thuốc</span>
                    <span className="text-white font-mono">12/15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Bệnh nhân</span>
                    <span className="text-white font-mono">24</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-neutral-700 bg-neutral-900 px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-neutral-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-neutral-400">
                Cập nhật: <span className="text-white font-mono">17:45:32</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-neutral-400">11 Tủ thuốc hoạt động</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-neutral-400">2 Cảnh báo</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-black">{children}</main>
      </div>
    </div>
  )
}
