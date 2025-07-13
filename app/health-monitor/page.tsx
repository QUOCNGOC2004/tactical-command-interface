"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Activity, Thermometer, Droplets, TrendingUp, AlertTriangle } from "lucide-react"

export default function HealthMonitorPage() {
  const [selectedPatient, setSelectedPatient] = useState(null)

  const patients = [
    {
      id: "BN-001",
      name: "NGUYỄN VĂN A",
      room: "101",
      age: 65,
      condition: "Tiểu đường",
      vitals: {
        heartRate: 78,
        spO2: 98,
        temperature: 36.8,
        bloodPressure: "130/85",
        steps: 2450,
        sleepQuality: 85,
        stressLevel: 32,
      },
      status: "stable",
      lastSync: "2 phút trước",
      alerts: [],
    },
    {
      id: "BN-002",
      name: "TRẦN THỊ B",
      room: "102",
      age: 72,
      condition: "Cao huyết áp",
      vitals: {
        heartRate: 95,
        spO2: 96,
        temperature: 37.2,
        bloodPressure: "145/92",
        steps: 1200,
        sleepQuality: 72,
        stressLevel: 58,
      },
      status: "warning",
      lastSync: "1 phút trước",
      alerts: ["Huyết áp cao", "Nhịp tim nhanh"],
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "stable":
        return "bg-white/20 text-white"
      case "warning":
        return "bg-orange-500/20 text-orange-500"
      case "critical":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getVitalStatus = (vital, value) => {
    switch (vital) {
      case "heartRate":
        if (value < 60 || value > 100) return "warning"
        return "normal"
      case "spO2":
        if (value < 95) return "critical"
        if (value < 98) return "warning"
        return "normal"
      case "temperature":
        if (value < 36 || value > 37.5) return "warning"
        if (value > 38) return "critical"
        return "normal"
      default:
        return "normal"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">THEO DÕI SỨC KHỎE</h1>
          <p className="text-sm text-neutral-400">Giám sát sinh hiệu từ Samsung Watch</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Đồng bộ dữ liệu</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Báo cáo y tế</Button>
        </div>
      </div>

      {/* Health Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">BỆNH NHÂN THEO DÕI</p>
                <p className="text-2xl font-bold text-white font-mono">24</p>
              </div>
              <Heart className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CẢNH BÁO</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">3</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ĐỒNG BỘ THÀNH CÔNG</p>
                <p className="text-2xl font-bold text-white font-mono">98%</p>
              </div>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">WATCH KẾT NỐI</p>
                <p className="text-2xl font-bold text-white font-mono">22/24</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Health Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {patients.map((patient) => (
          <Card
            key={patient.id}
            className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors cursor-pointer"
            onClick={() => setSelectedPatient(patient)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">{patient.name}</CardTitle>
                  <p className="text-xs text-neutral-400">
                    {patient.id} • Phòng {patient.room} • {patient.age} tuổi
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(patient.status)}>
                    {patient.status === "stable" ? "ỔN ĐỊNH" : patient.status === "warning" ? "CẢNH BÁO" : "NGUY HIỂM"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-neutral-400">
                <span className="text-white">{patient.condition}</span> • Đồng bộ: {patient.lastSync}
              </div>

              {/* Vital Signs Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-neutral-400">Nhịp tim</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {patient.vitals.heartRate} <span className="text-xs text-neutral-400">bpm</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-neutral-400">SpO2</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {patient.vitals.spO2}
                    <span className="text-xs text-neutral-400">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-neutral-400">Nhiệt độ</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {patient.vitals.temperature}
                    <span className="text-xs text-neutral-400">°C</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-white" />
                    <span className="text-xs text-neutral-400">Huyết áp</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">{patient.vitals.bloodPressure}</div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-neutral-400">Bước chân</div>
                  <div className="text-white font-mono">{patient.vitals.steps.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-neutral-400">Giấc ngủ</div>
                  <div className="text-white font-mono">{patient.vitals.sleepQuality}%</div>
                </div>
                <div className="text-center">
                  <div className="text-neutral-400">Stress</div>
                  <div className="text-white font-mono">{patient.vitals.stressLevel}%</div>
                </div>
              </div>

              {/* Alerts */}
              {patient.alerts.length > 0 && (
                <div className="space-y-1">
                  {patient.alerts.map((alert, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-orange-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedPatient.name}</CardTitle>
                <p className="text-sm text-neutral-400">
                  {selectedPatient.id} • Phòng {selectedPatient.room} • {selectedPatient.condition}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedPatient(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">SINH HIỆU CHÍNH</h3>
                    <div className="space-y-3">
                      {[
                        {
                          icon: Heart,
                          label: "Nhịp tim",
                          value: `${selectedPatient.vitals.heartRate} bpm`,
                          color: "text-red-500",
                        },
                        {
                          icon: Droplets,
                          label: "SpO2",
                          value: `${selectedPatient.vitals.spO2}%`,
                          color: "text-blue-500",
                        },
                        {
                          icon: Thermometer,
                          label: "Nhiệt độ",
                          value: `${selectedPatient.vitals.temperature}°C`,
                          color: "text-orange-500",
                        },
                        {
                          icon: Activity,
                          label: "Huyết áp",
                          value: selectedPatient.vitals.bloodPressure,
                          color: "text-white",
                        },
                      ].map((vital, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                          <div className="flex items-center gap-2">
                            <vital.icon className={`w-4 h-4 ${vital.color}`} />
                            <span className="text-sm text-neutral-300">{vital.label}</span>
                          </div>
                          <span className="text-sm text-white font-mono">{vital.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">HOẠT ĐỘNG & GIẤC NGỦ</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                        <span className="text-sm text-neutral-300">Số bước chân</span>
                        <span className="text-sm text-white font-mono">
                          {selectedPatient.vitals.steps.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                        <span className="text-sm text-neutral-300">Chất lượng giấc ngủ</span>
                        <span className="text-sm text-white font-mono">{selectedPatient.vitals.sleepQuality}%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                        <span className="text-sm text-neutral-300">Mức độ stress</span>
                        <span className="text-sm text-white font-mono">{selectedPatient.vitals.stressLevel}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Xem biểu đồ</Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Xuất báo cáo
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Gửi cho bác sĩ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
