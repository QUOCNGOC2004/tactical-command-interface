"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Droplets, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react"

interface WaterSystem {
  id: string
  system_code: string
  room_number: string
  bed_number?: string
  patient_id?: string
  status: "active" | "dispensing" | "low_water" | "maintenance" | "error"
  water_level: number
  pump_status: "ready" | "active" | "warning" | "error"
  last_dispense?: string
  next_schedule?: string
  daily_consumption: number
  max_daily_consumption: number
  patients?: {
    id: string
    name: string
    patient_code: string
    room_number: string
    bed_number?: string
  }
}

interface SystemStats {
  totalSystems: number
  activeSystems: number
  dispensingSystems: number
  lowWaterSystems: number
  maintenanceSystems: number
  totalConsumption: number
  lowestWaterSystem?: {
    system_code: string
    room_number: string
    water_level: number
  }
  highestConsumptionSystem?: {
    system_code: string
    room_number: string
    daily_consumption: number
  }
  upcomingSchedules: Array<{
    schedule_time: string
    dispense_amount: number
    water_systems: {
      system_code: string
      room_number: string
    }
  }>
}

export default function WaterSystemPage() {
  const [waterSystems, setWaterSystems] = useState<WaterSystem[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dispensingSystems, setDispensingSystems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchWaterSystems()
    fetchSystemStats()
  }, [])

  // Auto-refresh khi focus vào trang
  useEffect(() => {
    const handleFocus = () => {
      fetchWaterSystems()
      fetchSystemStats()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Auto-refresh data every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWaterSystems()
      fetchSystemStats()
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchWaterSystems = async () => {
    try {
      const response = await fetch("/api/water-systems")
      if (response.ok) {
        const data = await response.json()
        setWaterSystems(data)
      }
    } catch (error) {
      console.error("Error fetching water systems:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch("/api/water-systems/status")
      if (response.ok) {
        const data = await response.json()
        setSystemStats(data)
      }
    } catch (error) {
      console.error("Error fetching system stats:", error)
    }
  }

  const handleDispenseWater = async (systemId: string) => {
    if (dispensingSystems.has(systemId)) return

    setDispensingSystems(prev => new Set(prev).add(systemId))

    try {
      const response = await fetch(`/api/water-systems/${systemId}/dispense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 200, trigger_type: "manual" })
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Dispense result:", result.note)
        
        // Refresh data after successful dispense
        await fetchWaterSystems()
        await fetchSystemStats()
        
        // Auto-refresh after 3.5 seconds to catch the status reset from API
        setTimeout(async () => {
          await fetchWaterSystems()
          await fetchSystemStats()
        }, 3500)
      } else {
        const errorData = await response.json()
        console.error("Dispense error:", errorData.error)
      }
    } catch (error) {
      console.error("Error dispensing water:", error)
    } finally {
      setDispensingSystems(prev => {
        const newSet = new Set(prev)
        newSet.delete(systemId)
        return newSet
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-white/20 text-white"
      case "dispensing":
        return "bg-orange-500/20 text-orange-500"
      case "low_water":
        return "bg-red-500/20 text-red-500"
      case "maintenance":
        return "bg-neutral-500/20 text-neutral-300"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />
      case "dispensing":
        return <Droplets className="w-4 h-4" />
      case "low_water":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getWaterLevelColor = (level: number) => {
    if (level > 70) return "bg-white"
    if (level > 30) return "bg-orange-500"
    return "bg-red-500"
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "HOẠT ĐỘNG"
      case "dispensing":
        return "ĐANG PHÁT"
      case "low_water":
        return "SẮP HẾT NƯỚC"
      case "maintenance":
        return "BẢO TRÌ"
      case "error":
        return "LỖI"
      default:
        return "KHÔNG XÁC ĐỊNH"
    }
  }

  const getPumpStatusText = (pumpStatus: string) => {
    switch (pumpStatus) {
      case "active":
        return "ĐANG BƠM"
      case "ready":
        return "SẴN SÀNG"
      case "warning":
        return "CẢNH BÁO"
      case "error":
        return "LỖI"
      default:
        return "KHÔNG XÁC ĐỊNH"
    }
  }

  const getPumpStatusColor = (pumpStatus: string) => {
    switch (pumpStatus) {
      case "active":
        return "text-orange-500"
      case "ready":
        return "text-white"
      case "warning":
        return "text-orange-500"
      case "error":
        return "text-red-500"
      default:
        return "text-neutral-400"
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A"
    return new Date(timeString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Đang tải dữ liệu hệ thống nước...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">HỆ THỐNG CUNG CẤP NƯỚC</h1>
          <p className="text-sm text-neutral-400">Quản lý và giám sát hệ thống nước tự động</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => {
              fetchWaterSystems()
              fetchSystemStats()
            }}
          >
            Làm mới dữ liệu
          </Button>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={async () => {
              try {
                const response = await fetch("/api/water-systems/sync", {
                  method: "POST"
                })
                if (response.ok) {
                  const result = await response.json()
                  alert(`Đồng bộ thành công!\n${result.message}`)
                  // Refresh data after sync
                  fetchWaterSystems()
                  fetchSystemStats()
                } else {
                  const error = await response.json()
                  alert(`Lỗi đồng bộ: ${error.error}`)
                }
              } catch (error) {
                console.error("Error syncing:", error)
                alert("Lỗi khi đồng bộ hệ thống nước")
              }
            }}
          >
            Đồng bộ với bệnh nhân
          </Button>
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={async () => {
              try {
                const response = await fetch("/api/water-systems/status")
                if (response.ok) {
                  const stats = await response.json()
                  console.log("Current stats:", stats)
                  alert(`Thống kê hiện tại:\n- Tổng hệ thống: ${stats.totalSystems}\n- Hoạt động: ${stats.activeSystems}\n- Đang phát: ${stats.dispensingSystems}\n- Cảnh báo: ${stats.lowWaterSystems}`)
                }
              } catch (error) {
                console.error("Error checking stats:", error)
              }
            }}
          >
            Kiểm tra trạng thái
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Bơm nước khẩn cấp</Button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">HỆ THỐNG HOẠT ĐỘNG</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {systemStats ? `${systemStats.activeSystems}/${systemStats.totalSystems}` : "0/0"}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CẢNH BÁO NƯỚC</p>
                <p className="text-2xl font-bold text-red-500 font-mono">
                  {systemStats?.lowWaterSystems || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ĐANG PHÁT NƯỚC</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {systemStats?.dispensingSystems || 0}
                </p>
              </div>
              <Droplets className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TIÊU THỤ HÔM NAY</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {systemStats ? `${(systemStats.totalConsumption / 1000).toFixed(1)}L` : "0L"}
                </p>
              </div>
              <Droplets className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Water Systems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {waterSystems.map((system) => (
          <Card
            key={system.id}
            className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">
                    PHÒNG {system.room_number}
                    {system.bed_number && ` - GIƯỜNG ${system.bed_number}`}
                  </CardTitle>
                  <p className="text-xs text-neutral-400">
                    {system.patients?.name || "Chưa có bệnh nhân"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(system.status)}
                  <Badge className={getStatusColor(system.status)}>
                    {getStatusText(system.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Water Level Indicator */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-400">Mức nước</span>
                  <span className="text-white font-mono">{system.water_level}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3 relative overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getWaterLevelColor(system.water_level)}`}
                    style={{ width: `${system.water_level}%` }}
                  ></div>
                  {/* Water animation effect */}
                  {system.status === "dispensing" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>

              {/* System Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-neutral-400 mb-1">Phát lần cuối</div>
                  <div className="text-white font-mono">{formatTime(system.last_dispense)}</div>
                </div>
                <div>
                  <div className="text-neutral-400 mb-1">Lịch tiếp theo</div>
                  <div className="text-white font-mono">{formatTime(system.next_schedule)}</div>
                </div>
                <div>
                  <div className="text-neutral-400 mb-1">Tiêu thụ hôm nay</div>
                  <div className="text-white font-mono">{system.daily_consumption}ml</div>
                </div>
                <div>
                  <div className="text-neutral-400 mb-1">Trạng thái bơm</div>
                  <div className={`font-mono ${getPumpStatusColor(system.pump_status)}`}>
                    {getPumpStatusText(system.pump_status)}
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs"
                  disabled={system.status === "dispensing" || dispensingSystems.has(system.id)}
                  onClick={() => handleDispenseWater(system.id)}
                >
                  <Droplets className="w-3 h-3 mr-1" />
                  {dispensingSystems.has(system.id) ? "Đang phát..." : "Phát nước"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent text-xs"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Water Consumption Chart */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            BIỂU ĐỒ TIÊU THỤ NƯỚC THEO GIỜ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 relative">
            {/* Chart Grid */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-20">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="border border-neutral-700"></div>
              ))}
            </div>

            {/* Chart Bars */}
            <div className="absolute inset-0 flex items-end justify-around px-4">
              {[
                { hour: "06:00", consumption: 180, color: "bg-white" },
                { hour: "08:00", consumption: 220, color: "bg-white" },
                { hour: "10:00", consumption: 150, color: "bg-white" },
                { hour: "12:00", consumption: 200, color: "bg-white" },
                { hour: "14:00", consumption: 190, color: "bg-white" },
                { hour: "16:00", consumption: 250, color: "bg-orange-500" },
                { hour: "18:00", consumption: 210, color: "bg-white" },
                { hour: "20:00", consumption: 180, color: "bg-white" },
              ].map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-8 ${data.color} transition-all duration-300`}
                    style={{ height: `${(data.consumption / 300) * 160}px` }}
                  ></div>
                  <div className="text-xs text-neutral-400 mt-2 font-mono">{data.hour}</div>
                  <div className="text-xs text-neutral-500 font-mono">{data.consumption}ml</div>
                </div>
              ))}
            </div>

            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-8 font-mono">
              <span>300ml</span>
              <span>200ml</span>
              <span>100ml</span>
              <span>0ml</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CẢNH BÁO HỆ THỐNG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemStats?.lowestWaterSystem && systemStats.lowestWaterSystem.water_level < 20 && (
              <div className="text-xs border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-neutral-500 font-mono">{new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                  <Badge className="bg-orange-500/20 text-orange-500 text-xs">
                    {systemStats.lowestWaterSystem.system_code}
                  </Badge>
                </div>
                <div className="text-white">
                  Mức nước thấp tại Phòng {systemStats.lowestWaterSystem.room_number} - Cần bổ sung
                </div>
              </div>
            )}
            
            {systemStats?.highestConsumptionSystem && systemStats.highestConsumptionSystem.daily_consumption > 1500 && (
              <div className="text-xs border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-neutral-500 font-mono">{new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                  <Badge className="bg-orange-500/20 text-orange-500 text-xs">
                    {systemStats.highestConsumptionSystem.system_code}
                  </Badge>
                </div>
                <div className="text-white">
                  Tiêu thụ nước cao tại Phòng {systemStats.highestConsumptionSystem.room_number} - {systemStats.highestConsumptionSystem.daily_consumption}ml
                </div>
              </div>
            )}

            {systemStats?.upcomingSchedules.slice(0, 2).map((schedule, index) => (
              <div key={index} className="text-xs border-l-2 border-white pl-3 hover:bg-neutral-800 p-2 rounded transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-neutral-500 font-mono">{schedule.schedule_time}</div>
                  <Badge className="bg-white/20 text-white text-xs">
                    {schedule.water_systems.system_code}
                  </Badge>
                </div>
                <div className="text-white">
                  Lịch phát nước sắp tới - Phòng {schedule.water_systems.room_number} ({schedule.dispense_amount}ml)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}