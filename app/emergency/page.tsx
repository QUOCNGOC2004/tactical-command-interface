"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, Users, Clock, MapPin, Heart, Zap } from "lucide-react"

export default function EmergencyPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [callingPatientId, setCallingPatientId] = useState<string | null>(null)
  const [callingType, setCallingType] = useState<null | "medical" | "family">(null)
  const [activeAlerts, setActiveAlerts] = useState<{room: string, bed: string, patient: string}[]>([])

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientEmergencyCall = (patientId: string, type: "medical" | "family") => {
    setCallingPatientId(patientId)
    setCallingType(type)
    // Nếu là gọi khẩn cấp (nút app), thêm vào danh sách cảnh báo
    if (type === "medical") {
      const patient = (patients as any[]).find((p) => p.id === patientId)
      if (patient) {
        setActiveAlerts((prev) => [
          ...prev,
          { room: patient.room_number, bed: patient.bed_number, patient: patient.name }
        ])
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
          setActiveAlerts((prev) => prev.filter(a => !(a.room === patient.room_number && a.bed === patient.bed_number)))
        }, 5000)
      }
    }
    // Simulate call
    setTimeout(() => {
      setCallingPatientId(null)
      setCallingType(null)
    }, 3000)
  }

  const emergencyHistory = [
    {
      id: "EMG-001",
      time: "16:45:23",
      date: "17/06/2025",
      room: "101",
      patient: "Nguyễn Văn A",
      type: "medical",
      status: "resolved",
      responseTime: "2 phút 15 giây",
      description: "Bệnh nhân báo cáo đau ngực, nhịp tim tăng cao",
    },
    {
      id: "EMG-002",
      time: "14:22:10",
      date: "17/06/2025",
      room: "103",
      patient: "Lê Văn C",
      type: "family",
      status: "active",
      responseTime: "đang xử lý",
      description: "Yêu cầu gọi người nhà đến khẩn cấp",
    },
    {
      id: "EMG-003",
      time: "09:15:45",
      date: "17/06/2025",
      room: "102",
      patient: "Trần Thị B",
      type: "medical",
      status: "resolved",
      responseTime: "1 phút 45 giây",
      description: "Huyết áp tăng đột ngột, cần can thiệp y tế",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Ô cảnh báo khẩn cấp */}
      {activeAlerts.length > 0 && (
        <div className="mb-4 p-4 bg-red-500/20 border-l-4 border-red-500 rounded text-red-700 font-bold text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>CẢNH BÁO KHẨN CẤP:</span>
            <span>
              {activeAlerts.map((a, idx) => (
                <span key={idx} className="mr-3">
                  Phòng {a.room}{a.bed ? ` - Giường ${a.bed}` : ""} ({a.patient})
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">HỆ THỐNG KHẨN CẤP</h1>
          <p className="text-sm text-neutral-400">Gọi y tá, bác sĩ và người nhà khi cần thiết</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-red-500 hover:bg-red-600 text-white">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Test hệ thống
          </Button>
        </div>
      </div>

      {/* Danh sách bệnh nhân với nút gọi riêng */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {patients.map((patient: any) => (
          <Card key={patient.id} className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">
                    {patient.name}
                  </CardTitle>
                  <p className="text-xs text-neutral-400">
                    Phòng {patient.room_number} - Giường {patient.bed_number}
                  </p>
                </div>
                <Badge className="bg-white/20 text-white text-xs">{patient.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs"
                  disabled={callingPatientId === patient.id && callingType === "medical"}
                  onClick={() => handlePatientEmergencyCall(patient.id, "medical")}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  {callingPatientId === patient.id && callingType === "medical" ? "Đang gọi..." : "Gọi khẩn cấp"}
                </Button>
                <div className="flex-1 flex flex-col items-center">
                  <Button
                    size="sm"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs"
                    disabled={callingPatientId === patient.id && callingType === "family"}
                    onClick={() => handlePatientEmergencyCall(patient.id, "family")}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    {callingPatientId === patient.id && callingType === "family" ? "Đang gọi..." : "Gọi người nhà"}
                  </Button>
                  {patient.emergency_contact && (
                    <span className="mt-1 text-xs text-orange-400 font-mono text-center block w-full truncate">
                      {patient.emergency_contact}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
