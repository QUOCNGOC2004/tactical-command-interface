"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Edit2, Trash2, User, Pill, Calendar } from "lucide-react"

interface Patient {
  id: string
  name: string
  room_number: string
  patient_code: string
}

interface Medication {
  id: string
  name: string
  dosage: string
}

interface MedicationSchedule {
  id: string
  patient_id: string
  medication_id: string
  cabinet_id: string
  time_of_day: string
  compartment: "compartment1" | "compartment2"
  dosage_amount: number
  is_active: boolean
  status: "scheduled" | "pending" | "taken" | "missed" | "skipped"
  notes?: string
  patients: { name: string; room_number: string }
  medications: { name: string; dosage: string }
  medicine_cabinets: { cabinet_code: string }
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<MedicationSchedule | null>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    patient_id: "",
    medication_id: "",
    time_of_day: "",
    compartment: "compartment1" as "compartment1" | "compartment2",
    dosage_amount: 1,
    notes: "",
  })

  useEffect(() => {
    Promise.all([fetchSchedules(), fetchPatients(), fetchMedications()]).finally(() => setLoading(false))
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/medication-schedules")
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
    }
  }

  const fetchMedications = async () => {
    try {
      const response = await fetch("/api/medications")
      if (response.ok) {
        const data = await response.json()
        setMedications(data)
      }
    } catch (error) {
      console.error("Error fetching medications:", error)
    }
  }

  // ─── handleSubmit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // validation cơ bản
    if (!formData.patient_id || !formData.medication_id) {
      alert("Vui lòng chọn bệnh nhân và thuốc!")
      return
    }

    try {
      // Lấy tủ thuốc của bệnh nhân
      const cabinetRes = await fetch(`/api/patients/${formData.patient_id}`)
      if (!cabinetRes.ok) {
        alert("Không tìm thấy bệnh nhân hoặc máy chủ lỗi, vui lòng thử lại!")
        return
      }

      let patientData: any = null
      try {
        patientData = await cabinetRes.json()
      } catch {
        alert("Không đọc được dữ liệu bệnh nhân, vui lòng thử lại!")
        return
      }

      const cabinet = patientData?.medicine_cabinets?.[0]
      if (!cabinet?.id) {
        alert("Bệnh nhân này chưa được gán tủ thuốc, vui lòng kiểm tra lại.")
        return
      }

      const schedulePayload = {
        ...formData,
        cabinet_id: cabinet.id, // đã chắc chắn là UUID hợp lệ
      }

      const url = editingSchedule ? `/api/medication-schedules/${editingSchedule.id}` : "/api/medication-schedules"

      const res = await fetch(url, {
        method: editingSchedule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedulePayload),
      })

      if (!res.ok) throw new Error("Lưu lịch trình thất bại")

      await fetchSchedules()
      resetForm()
    } catch (err) {
      console.error("Error saving schedule:", err)
      alert("Đã có lỗi xảy ra, vui lòng thử lại!")
    }
  }

  const handleEdit = (schedule: MedicationSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      patient_id: schedule.patient_id,
      medication_id: schedule.medication_id,
      time_of_day: schedule.time_of_day,
      compartment: schedule.compartment,
      dosage_amount: schedule.dosage_amount,
      notes: schedule.notes || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa lịch trình này?")) {
      try {
        const response = await fetch(`/api/medication-schedules/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          await fetchSchedules()
        }
      } catch (error) {
        console.error("Error deleting schedule:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      patient_id: "",
      medication_id: "",
      time_of_day: "",
      compartment: "compartment1",
      dosage_amount: 1,
      notes: "",
    })
    setEditingSchedule(null)
    setShowForm(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken":
        return "bg-white/20 text-white"
      case "pending":
        return "bg-orange-500/20 text-orange-500"
      case "missed":
        return "bg-red-500/20 text-red-500"
      case "skipped":
        return "bg-neutral-500/20 text-neutral-300"
      default:
        return "bg-blue-500/20 text-blue-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "taken":
        return "ĐÃ UỐNG"
      case "pending":
        return "CHỜ UỐNG"
      case "missed":
        return "BỎ LỠ"
      case "skipped":
        return "BỎ QUA"
      default:
        return "ĐÃ LÊN LỊCH"
    }
  }

  const getCompartmentText = (compartment: string) => {
    switch (compartment) {
      case "compartment1":
        return "NGĂN 1"
      case "compartment2":
        return "NGĂN 2"
      default:
        return compartment.toUpperCase()
    }
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

  // Group schedules by time
  const groupedSchedules = schedules.reduce(
    (groups, schedule) => {
      const time = schedule.time_of_day
      if (!groups[time]) {
        groups[time] = []
      }
      groups[time].push(schedule)
      return groups
    },
    {} as Record<string, MedicationSchedule[]>,
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">LỊCH TRÌNH UỐNG THUỐC</h1>
          <p className="text-sm text-neutral-400">Quản lý và theo dõi lịch trình uống thuốc của bệnh nhân</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Thêm lịch trình
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TỔNG LỊCH TRÌNH</p>
                <p className="text-2xl font-bold text-white font-mono">{schedules.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CHỜ UỐNG</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {schedules.filter((s) => s.status === "pending").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ĐÃ UỐNG HÔM NAY</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {schedules.filter((s) => s.status === "taken").length}
                </p>
              </div>
              <Pill className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">BỎ LỠ</p>
                <p className="text-2xl font-bold text-red-500 font-mono">
                  {schedules.filter((s) => s.status === "missed").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedSchedules)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, timeSchedules]) => (
            <Card key={time} className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  {time}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {timeSchedules.map((schedule) => (
                    <Card
                      key={schedule.id}
                      className="bg-neutral-800 border-neutral-600 hover:border-orange-500/50 transition-colors"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-neutral-400" />
                            <div>
                              <div className="text-sm font-medium text-white">{schedule.patients.name}</div>
                              <div className="text-xs text-neutral-400">Phòng {schedule.patients.room_number}</div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(schedule.status)}>{getStatusText(schedule.status)}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="text-sm text-white">{schedule.medications.name}</div>
                              <div className="text-xs text-neutral-400">
                                {schedule.medications.dosage} × {schedule.dosage_amount}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="text-neutral-400">
                              Ngăn: <span className="text-white">{getCompartmentText(schedule.compartment)}</span>
                            </div>
                            <div className="text-neutral-400">
                              Tủ:{" "}
                              <span className="text-white font-mono">{schedule.medicine_cabinets.cabinet_code}</span>
                            </div>
                          </div>

                          {schedule.notes && (
                            <div className="text-xs text-neutral-300 bg-neutral-700 p-2 rounded">{schedule.notes}</div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-neutral-600">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                            className="bg-neutral-700 hover:bg-neutral-600 text-white flex-1"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(schedule.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 flex-1"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">
                {editingSchedule ? "CẬP NHẬT LỊCH TRÌNH" : "THÊM LỊCH TRÌNH MỚI"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-neutral-300">Bệnh nhân *</Label>
                    <Select
                      value={formData.patient_id}
                      onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Chọn bệnh nhân" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - Phòng {patient.room_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-neutral-300">Thuốc *</Label>
                    <Select
                      value={formData.medication_id}
                      onValueChange={(value) => setFormData({ ...formData, medication_id: value })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Chọn thuốc" />
                      </SelectTrigger>
                      <SelectContent>
                        {medications.map((medication) => (
                          <SelectItem key={medication.id} value={medication.id}>
                            {medication.name} - {medication.dosage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="time_of_day" className="text-neutral-300">
                      Giờ uống *
                    </Label>
                    <Input
                      id="time_of_day"
                      type="time"
                      value={formData.time_of_day}
                      onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Ngăn tủ thuốc *</Label>
                    <Select
                      value={formData.compartment}
                      onValueChange={(value) =>
                        setFormData({ ...formData, compartment: value as "compartment1" | "compartment2" })
                      }
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Chọn ngăn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compartment1">Ngăn 1</SelectItem>
                        <SelectItem value="compartment2">Ngăn 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dosage_amount" className="text-neutral-300">
                      Số lượng *
                    </Label>
                    <Input
                      id="dosage_amount"
                      type="number"
                      value={formData.dosage_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, dosage_amount: Number.parseInt(e.target.value) || 1 })
                      }
                      className="bg-neutral-800 border-neutral-600 text-white"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-neutral-300">
                    Ghi chú
                  </Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white"
                    placeholder="Ghi chú thêm về lịch trình..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                    {editingSchedule ? "Cập nhật" : "Thêm lịch trình"}
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white flex-1"
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
