"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill, Heart, AlertTriangle, Users, Activity, Shield, Database } from "lucide-react"

interface DashboardStats {
  totalPatients: number
  activeCabinets: number
  pendingMedications: number
  emergencyAlerts: number
  systemUptime: string
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeCabinets: 0,
    pendingMedications: 0,
    emergencyAlerts: 0,
    systemUptime: "168:45:12",
  })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardStats()
    fetchNotifications()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch patients count
      const patientsResponse = await fetch("/api/patients")
      const patients = patientsResponse.ok ? await patientsResponse.json() : []

      // Fetch cabinets count
      const cabinetsResponse = await fetch("/api/medicine-cabinets")
      const cabinets = cabinetsResponse.ok ? await cabinetsResponse.json() : []

      // Fetch schedules count
      const schedulesResponse = await fetch("/api/medication-schedules")
      const schedules = schedulesResponse.ok ? await schedulesResponse.json() : []

      setStats({
        totalPatients: patients.length,
        activeCabinets: cabinets.filter((c: any) => c.status !== "error").length,
        pendingMedications: schedules.filter((s: any) => s.status === "pending").length,
        emergencyAlerts: cabinets.filter((c: any) => c.status === "error").length,
        systemUptime: "168:45:12",
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      // Ưu tiên lấy từ API nếu có
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.slice(0, 10))
        return
      }
    } catch {}
    // Nếu không có API, thử lấy từ localStorage
    try {
      const local = localStorage.getItem("notifications")
      if (local) {
        setNotifications(JSON.parse(local).slice(0, 10))
        return
      }
    } catch {}
    // Nếu không có, để trống
    setNotifications([])
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-800 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wider">MEDISAFE DASHBOARD</h1>
          <p className="text-sm text-neutral-400">Hệ thống quản lý tủ thuốc thông minh</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm text-white font-medium">HỆ THỐNG HOẠT ĐỘNG</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300 tracking-wider font-medium">BỆNH NHÂN</p>
                <p className="text-3xl font-bold text-white font-mono">{stats.totalPatients}</p>
                <p className="text-xs text-blue-200 mt-1">Đang theo dõi</p>
              </div>
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-300 tracking-wider font-medium">TỦ THUỐC</p>
                <p className="text-3xl font-bold text-white font-mono">{stats.activeCabinets}</p>
                <p className="text-xs text-orange-200 mt-1">Hoạt động</p>
              </div>
              <Pill className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 tracking-wider font-medium">CHỜ UỐNG THUỐC</p>
                <p className="text-3xl font-bold text-white font-mono">{stats.pendingMedications}</p>
                <p className="text-xs text-green-200 mt-1">Lịch trình hôm nay</p>
              </div>
              <Activity className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300 tracking-wider font-medium">CẢNH BÁO</p>
                <p className="text-3xl font-bold text-white font-mono">{stats.emergencyAlerts}</p>
                <p className="text-xs text-red-200 mt-1">Cần xử lý</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              TRẠNG THÁI HỆ THỐNG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">98.7%</div>
                <div className="text-sm text-neutral-400">Độ tin cậy</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stats.systemUptime}</div>
                <div className="text-sm text-neutral-400">Thời gian hoạt động</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">24/7</div>
                <div className="text-sm text-neutral-400">Giám sát liên tục</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">HOẠT ĐỘNG GẦN ĐÂY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-neutral-500 text-sm">Chưa có hoạt động nào gần đây.</div>
              ) : (
                notifications.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
                    <div className="text-xs text-neutral-400 font-mono min-w-[60px]">
                      {activity.time || activity.created_at || "--:--"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">{activity.action || activity.title || activity.message}</div>
                      {activity.patient && <div className="text-xs text-neutral-400">{activity.patient}</div>}
                    </div>
                    <Badge
                      className={
                        activity.status === "success"
                          ? "bg-white/20 text-white"
                          : activity.status === "warning"
                          ? "bg-orange-500/20 text-orange-500"
                          : "bg-red-500/20 text-red-500"
                      }
                    >
                      {activity.status === "success"
                        ? "THÀNH CÔNG"
                        : activity.status === "warning"
                        ? "CẢNH BÁO"
                        : activity.status === "alert"
                        ? "KHẨN CẤP"
                        : "THÔNG BÁO"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">THAO TÁC NHANH</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 hover:text-blue-200 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Thêm bệnh nhân</span>
            </Button>
            <Button className="h-20 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 hover:text-orange-200 flex-col gap-2">
              <Pill className="w-6 h-6" />
              <span className="text-sm">Quản lý thuốc</span>
            </Button>
            <Button className="h-20 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 hover:text-red-200 flex-col gap-2">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm">Khẩn cấp</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
