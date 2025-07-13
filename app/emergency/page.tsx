"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, Users, Clock, MapPin, Heart, Zap } from "lucide-react"

export default function EmergencyPage() {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [selectedEmergency, setSelectedEmergency] = useState(null)

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

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-red-500/20 text-red-500"
      case "resolved":
        return "bg-white/20 text-white"
      case "pending":
        return "bg-orange-500/20 text-orange-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "medical":
        return <Heart className="w-4 h-4" />
      case "family":
        return <Users className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const handleEmergencyCall = (type) => {
    setEmergencyActive(true)
    // Simulate emergency call
    setTimeout(() => {
      setEmergencyActive(false)
    }, 5000)
  }

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

      {/* Emergency Call Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-red-500/50">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold text-red-500 tracking-wider flex items-center justify-center gap-2">
              <Heart className="w-6 h-6" />
              KHẨN CẤP Y TẾ
            </CardTitle>
            <p className="text-sm text-neutral-400">Gọi y tá và bác sĩ đến phòng bệnh</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-16 bg-red-500 hover:bg-red-600 text-white text-lg font-bold"
              onClick={() => handleEmergencyCall("medical")}
              disabled={emergencyActive}
            >
              {emergencyActive ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ĐANG GỌI...
                </div>
              ) : (
                <>
                  <Phone className="w-6 h-6 mr-2" />
                  GỌI Y TÁ & BÁC SĨ
                </>
              )}
            </Button>
            <div className="text-xs text-neutral-400 text-center">Nhấn để gọi nhân viên y tế đến ngay lập tức</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-orange-500/50">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold text-orange-500 tracking-wider flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              GỌI NGƯỜI NHÀ
            </CardTitle>
            <p className="text-sm text-neutral-400">Thông báo người nhà đến thăm</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold"
              onClick={() => handleEmergencyCall("family")}
              disabled={emergencyActive}
            >
              {emergencyActive ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ĐANG GỌI...
                </div>
              ) : (
                <>
                  <Users className="w-6 h-6 mr-2" />
                  GỌI NGƯỜI NHÀ
                </>
              )}
            </Button>
            <div className="text-xs text-neutral-400 text-center">Nhấn để thông báo người nhà đến thăm</div>
          </CardContent>
        </Card>
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

      {/* Emergency History */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">LỊCH SỬ KHẨN CẤP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emergencyHistory.map((emergency) => (
              <div
                key={emergency.id}
                className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedEmergency(emergency)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(emergency.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white tracking-wider">{emergency.id}</h3>
                          <Badge className={getStatusColor(emergency.status)}>
                            {emergency.status === "active"
                              ? "ĐANG XỬ LÝ"
                              : emergency.status === "resolved"
                                ? "ĐÃ GIẢI QUYẾT"
                                : "CHỜ XỬ LÝ"}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-400">
                          {emergency.type === "medical" ? "Khẩn cấp y tế" : "Gọi người nhà"} • Phòng {emergency.room} •{" "}
                          {emergency.patient}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-300 ml-7">{emergency.description}</p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {emergency.time} - {emergency.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>Phòng {emergency.room}</span>
                      </div>
                      <div className="font-mono">Phản hồi: {emergency.responseTime}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Detail Modal */}
      {selectedEmergency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">{selectedEmergency.id}</CardTitle>
                <p className="text-sm text-neutral-400">
                  {selectedEmergency.type === "medical" ? "Khẩn cấp y tế" : "Gọi người nhà"}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedEmergency(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">TRẠNG THÁI</p>
                  <Badge className={getStatusColor(selectedEmergency.status)}>
                    {selectedEmergency.status === "active"
                      ? "ĐANG XỬ LÝ"
                      : selectedEmergency.status === "resolved"
                        ? "ĐÃ GIẢI QUYẾT"
                        : "CHỜ XỬ LÝ"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">PHÒNG</p>
                  <p className="text-sm text-white">{selectedEmergency.room}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">BỆNH NHÂN</p>
                  <p className="text-sm text-white">{selectedEmergency.patient}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">THỜI GIAN PHẢN HỒI</p>
                  <p className="text-sm text-white font-mono">{selectedEmergency.responseTime}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">MÔ TẢ</p>
                <p className="text-sm text-neutral-300">{selectedEmergency.description}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Xem chi tiết</Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Xuất báo cáo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
