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
                <Button
                  size="sm"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs"
                  disabled={callingPatientId === patient.id && callingType === "family"}
                  onClick={() => handlePatientEmergencyCall(patient.id, "family")}
                >
                  <Users className="w-3 h-3 mr-1" />
                  {callingPatientId === patient.id && callingType === "family" ? "Đang gọi..." : "Gọi người nhà"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CUỘC GỌI HÔM NAY</p>
                <p className="text-2xl font-bold text-white font-mono">7</p>
              </div>
              <Phone className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">KHẨN CẤP Y TẾ</p>
                <p className="text-2xl font-bold text-red-500 font-mono">3</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">GỌI NGƯỜI NHÀ</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">4</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">THỜI GIAN PHẢN HỒI</p>
                <p className="text-2xl font-bold text-white font-mono">1.8m</p>
              </div>
              <Clock className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Web Emergency Slider for Family */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            THANH TRƯỢT KHẨN CẤP - DÀNH CHO NGƯỜI NHÀ
          </CardTitle>
          <p className="text-xs text-neutral-400">Kéo thanh trượt để gọi khẩn cấp từ web interface</p>
        </CardHeader>
        <CardContent>
          <div className="bg-neutral-800 rounded-lg p-6">
            <div className="relative">
              <div className="w-full h-16 bg-gradient-to-r from-neutral-700 to-red-500 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  TRƯỢT ĐỂ GỌI KHẨN CẤP
                </div>
                <div className="absolute left-2 top-2 w-12 h-12 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-neutral-200 transition-colors">
                  <Zap className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-neutral-400 text-center">
              Chức năng này cho phép người nhà gọi khẩn cấp từ xa thông qua web interface
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
