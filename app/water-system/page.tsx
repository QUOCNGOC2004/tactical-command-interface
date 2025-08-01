"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Droplets, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
  medicine_cabinets?: {
    cabinet_code: string;
    patients?: {
      name: string;
      room_number: string;
      bed_number?: string;
    }
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
  const { toast } = useToast()
  const [waterAlert, setWaterAlert] = useState<string | null>(null)

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
        setWaterAlert(null) // Xóa cảnh báo khi phát nước thành công
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
        // Lấy thông tin hệ thống nước để cảnh báo cụ thể
        const system = waterSystems.find(ws => ws.id === systemId)
        let location = ""
        if (system) {
          location = system.medicine_cabinets?.patients
            ? ` (Phòng ${system.medicine_cabinets.patients.room_number}${system.medicine_cabinets.patients.bed_number ? ` - Giường ${system.medicine_cabinets.patients.bed_number}` : ""}${system.medicine_cabinets.patients.name ? ` - ${system.medicine_cabinets.patients.name}` : ""})`
            : "";
        }
        if (errorData.error === "Hết nước trong bình") {
          setWaterAlert(`Hết nước trong bình${location}! Vui lòng bơm nước.`)
        } else if (errorData.error === "Hệ thống nước không tồn tại") {
          setWaterAlert(`Không tìm thấy hệ thống nước${location}! Vui lòng kiểm tra lại hoặc liên hệ quản trị viên.`)
        } else {
          setWaterAlert((errorData.error || "Lỗi không xác định khi phát nước.") + location)
        }
      }
    } catch (error) {
      setWaterAlert("Lỗi không xác định khi phát nước.")
    } finally {
      setDispensingSystems(prev => {
        const newSet = new Set(prev)
        newSet.delete(systemId)
        return newSet
      })
    }
  }

  const handleRefillWater = async (systemId: string) => {
    try {
      const response = await fetch(`/api/water-systems/${systemId}/refill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      if (response.ok) {
        setWaterAlert(null) // Xóa cảnh báo khi bơm nước thành công
        await fetchWaterSystems()
        await fetchSystemStats()
      } else {
        const errorData = await response.json()
        setWaterAlert("Lỗi bơm nước: " + errorData.error)
      }
    } catch (error) {
      setWaterAlert("Lỗi bơm nước")
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
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white tracking-wider">HỆ THỐNG CUNG CẤP NƯỚC</h1>
        <p className="text-sm text-neutral-400">Quản lý và giám sát hệ thống nước tự động</p>
      </div>

      {/* ...đã xóa các mục thống kê hệ thống nước... */}

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
                    HỆ THỐNG NƯỚC: {system.medicine_cabinets?.cabinet_code || system.system_code}
                  </CardTitle>
                  <div className="text-xs text-neutral-400">
                    Tủ thuốc: {system.medicine_cabinets?.cabinet_code ? system.medicine_cabinets.cabinet_code : "Chưa liên kết"}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {system.medicine_cabinets?.patients?.name ? (
                      <>
                        Bệnh nhân: {system.medicine_cabinets.patients.name}
                        <div>
                          {system.medicine_cabinets.patients.room_number && (
                            <span>Phòng: {system.medicine_cabinets.patients.room_number}</span>
                          )}
                          {system.medicine_cabinets.patients.bed_number && (
                            <span> &ndash; Giường: {system.medicine_cabinets.patients.bed_number}</span>
                          )}
                        </div>
                      </>
                    ) : "Chưa có bệnh nhân"}
                  </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Alerts */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CẢNH BÁO HỆ THỐNG</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Hiển thị cảnh báo nước khi phát nước lỗi */}
          {waterAlert && (
            <div className="mb-3 text-xs text-red-500 font-bold bg-red-500/10 p-2 rounded">
              {waterAlert}
            </div>
          )}
          {/* Hiển thị số lượng hệ thống nước cảnh báo mức nước thấp */}
          {systemStats && (
            <div className="mb-3 text-xs text-orange-400">
              Có {waterSystems.filter(ws => ws.water_level < 40).length} hệ thống nước mức nước thấp (&lt;40%)
            </div>
          )}
          <div className="space-y-3">
            {systemStats?.lowestWaterSystem && systemStats.lowestWaterSystem.water_level < 40 && (
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