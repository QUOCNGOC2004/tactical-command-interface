"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, User, MapPin, Clock, Heart, Pill, Calendar, Plus, Bed } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Patient {
  id: string
  patient_code: string
  name: string
  age: number
  room_number: string
  bed_number: string
  condition: string
  admission_date: string
  status: string
  doctor_name: string
  emergency_contact: string
  created_at: string
  medicine_cabinets?: Array<{
    id: string
    cabinet_code: string
    status: string
  }>
}

interface Doctor {
  id: string
  doctor_code: string
  name: string
  specialization: string
  department: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availableBeds, setAvailableBeds] = useState<Record<string, string[]>>({})
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  // Danh sách phòng mặc định
  const roomNumbers = ["101", "102", "103", "104", "105", "201", "202", "203", "204", "205"]

  // State cho form thêm bệnh nhân
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFormData, setAddFormData] = useState({
    name: "",
    age: "",
    room_number: "",
    bed_number: "",
    condition: "",
    admission_date: "",
    doctor_name: "",
    emergency_contact: "",
    status: "stable",
  })

  // State cho form sửa bệnh nhân
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    age: "",
    room_number: "",
    bed_number: "",
    condition: "",
    admission_date: "",
    doctor_name: "",
    emergency_contact: "",
    status: "stable",
  })

  // State cho xác nhận xóa
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)

  useEffect(() => {
    fetchPatients()
    fetchDoctors()
    fetchAvailableBeds()
  }, [])

  useEffect(() => {
    const filtered = patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.room_number.includes(searchTerm) ||
        patient.bed_number.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredPatients(filtered)
  }, [patients, searchTerm])

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

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors")
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      }
    } catch (error) {
      console.error("Error fetching doctors:", error)
    }
  }

  const fetchAvailableBeds = async () => {
    try {
      const response = await fetch("/api/available-beds")
      if (response.ok) {
        const data = await response.json()
        setAvailableBeds(data)
      }
    } catch (error) {
      console.error("Error fetching available beds:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "bg-white/20 text-white"
      case "monitoring":
        return "bg-orange-500/20 text-orange-500"
      case "critical":
        return "bg-red-500/20 text-red-500"
      case "recovering":
        return "bg-white/20 text-white"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "stable":
        return "ỔN ĐỊNH"
      case "monitoring":
        return "THEO DÕI"
      case "critical":
        return "NGUY HIỂM"
      case "recovering":
        return "ĐANG HỒI PHỤC"
      default:
        return "KHÔNG XÁC ĐỊNH"
    }
  }

  // Hàm xử lý thêm bệnh nhân
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addFormData,
          age: Number.parseInt(addFormData.age) || 0,
          admission_date: addFormData.admission_date,
        }),
      })

      if (response.ok) {
        await fetchPatients() // Refresh danh sách bệnh nhân
        await fetchAvailableBeds() // Refresh danh sách giường trống
        setShowAddForm(false)
        setAddFormData({
          name: "",
          age: "",
          room_number: "",
          bed_number: "",
          condition: "",
          admission_date: "",
          doctor_name: "",
          emergency_contact: "",
          status: "stable",
        })
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Có lỗi xảy ra khi thêm bệnh nhân")
      }
    } catch (error) {
      console.error("Error adding patient:", error)
      alert("Có lỗi xảy ra khi thêm bệnh nhân")
    }
  }

  // Hàm xử lý sửa bệnh nhân
  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/patients/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          age: Number.parseInt(editFormData.age) || 0,
          room_number: editFormData.room_number,
          bed_number: editFormData.bed_number,
          condition: editFormData.condition,
          admission_date: editFormData.admission_date,
          doctor_name: editFormData.doctor_name,
          emergency_contact: editFormData.emergency_contact,
          status: editFormData.status,
        }),
      })

      if (response.ok) {
        await fetchPatients() // Refresh danh sách bệnh nhân
        await fetchAvailableBeds() // Refresh danh sách giường trống
        setShowEditForm(false)
        setSelectedPatient(null)
        setEditFormData({
          id: "",
          name: "",
          age: "",
          room_number: "",
          bed_number: "",
          condition: "",
          admission_date: "",
          doctor_name: "",
          emergency_contact: "",
          status: "stable",
        })
      }
    } catch (error) {
      console.error("Error updating patient:", error)
    }
  }

  // Hàm xử lý xóa bệnh nhân
  const handleDeletePatient = async () => {
    if (!patientToDelete) return

    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchPatients() // Refresh danh sách bệnh nhân
        await fetchAvailableBeds() // Refresh danh sách giường trống
        setShowDeleteConfirm(false)
        setPatientToDelete(null)
        setSelectedPatient(null)
      }
    } catch (error) {
      console.error("Error deleting patient:", error)
    }
  }

  // Hàm mở form sửa
  const openEditForm = (patient: Patient) => {
    setEditFormData({
      id: patient.id,
      name: patient.name,
      age: patient.age.toString(),
      room_number: patient.room_number,
      bed_number: patient.bed_number,
      condition: patient.condition || "",
      admission_date: patient.admission_date,
      doctor_name: patient.doctor_name || "",
      emergency_contact: patient.emergency_contact || "",
      status: patient.status,
    })
    setShowEditForm(true)
    setSelectedPatient(null)
  }

  // Hàm mở xác nhận xóa
  const openDeleteConfirm = (patient: Patient) => {
    setPatientToDelete(patient)
    setShowDeleteConfirm(true)
    setSelectedPatient(null)
  }

  // Reset bed selection when room changes
  const handleRoomChange = (room: string, isEdit = false) => {
    if (isEdit) {
      setEditFormData({ ...editFormData, room_number: room, bed_number: "" })
    } else {
      setAddFormData({ ...addFormData, room_number: room, bed_number: "" })
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">QUẢN LÝ BỆNH NHÂN</h1>
          <p className="text-sm text-neutral-400">Theo dõi và quản lý thông tin bệnh nhân</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Thêm bệnh nhân
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Tìm bệnh nhân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TỔNG BỆNH NHÂN</p>
                <p className="text-2xl font-bold text-white font-mono">{patients.length}</p>
              </div>
              <User className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">NGUY HIỂM</p>
                <p className="text-2xl font-bold text-red-500 font-mono">
                  {patients.filter((p) => p.status === "critical").length}
                </p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">THEO DÕI</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {patients.filter((p) => p.status === "monitoring").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => {
          return (
            <Card
              key={patient.id}
              className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedPatient(patient)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-neutral-400" />
                    <div>
                      <CardTitle className="text-sm font-bold text-white tracking-wider">{patient.name}</CardTitle>
                      <p className="text-xs text-neutral-400">
                        {patient.patient_code} • {patient.age} tuổi
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(patient.status)}>{getStatusText(patient.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-300">Phòng {patient.room_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-300">Giường {patient.bed_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-300">
                      {new Date(patient.admission_date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {patient.condition && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">CHẨN ĐOÁN</p>
                    <p className="text-sm text-white">{patient.condition}</p>
                  </div>
                )}

                {patient.doctor_name && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">BÁC SĨ ĐIỀU TRỊ</p>
                    <p className="text-sm text-white">{patient.doctor_name}</p>
                  </div>
                )}

                {/* Vital Signs section removed */}

                {/* Tủ thuốc */}
                {patient.medicine_cabinets && patient.medicine_cabinets.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">TỦ THUỐC</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.medicine_cabinets.map((cabinet) => (
                        <Badge key={cabinet.id} className="bg-neutral-800 text-neutral-300 text-xs">
                          {cabinet.cabinet_code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Hiển thị thông báo nếu không có bệnh nhân */}
      {filteredPatients.length === 0 && !loading && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Chưa có bệnh nhân nào</h3>
            <p className="text-neutral-400 mb-4">
              {searchTerm ? "Không tìm thấy bệnh nhân phù hợp" : "Hãy thêm bệnh nhân đầu tiên"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Thêm bệnh nhân đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedPatient.name}</CardTitle>
                <p className="text-sm text-neutral-400">
                  {selectedPatient.patient_code} • {selectedPatient.age} tuổi • Phòng {selectedPatient.room_number} •
                  Giường {selectedPatient.bed_number}
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
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">THÔNG TIN BỆNH NHÂN</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Trạng thái:</span>
                        <Badge className={getStatusColor(selectedPatient.status)}>
                          {getStatusText(selectedPatient.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Vị trí:</span>
                        <span className="text-white">
                          Phòng {selectedPatient.room_number} - Giường {selectedPatient.bed_number}
                        </span>
                      </div>
                      {selectedPatient.condition && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Chẩn đoán:</span>
                          <span className="text-white">{selectedPatient.condition}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Ngày nhập viện:</span>
                        <span className="text-white font-mono">
                          {new Date(selectedPatient.admission_date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      {selectedPatient.doctor_name && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Bác sĩ điều trị:</span>
                          <span className="text-white">{selectedPatient.doctor_name}</span>
                        </div>
                      )}
                      {selectedPatient.emergency_contact && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Liên hệ khẩn cấp:</span>
                          <span className="text-white font-mono">{selectedPatient.emergency_contact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tủ thuốc */}
                  {selectedPatient.medicine_cabinets && selectedPatient.medicine_cabinets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">TỦ THUỐC</h3>
                      <div className="space-y-2">
                        {selectedPatient.medicine_cabinets.map((cabinet) => (
                          <div key={cabinet.id} className="flex items-center gap-2 p-2 bg-neutral-800 rounded">
                            <Pill className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-white">{cabinet.cabinet_code}</span>
                            <Badge
                              className={
                                cabinet.status === "locked"
                                  ? "bg-white/20 text-white"
                                  : "bg-orange-500/20 text-orange-500"
                              }
                            >
                              {cabinet.status === "locked" ? "KHÓA" : "MỞ"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Health monitoring section removed */}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button
                  onClick={() => openEditForm(selectedPatient!)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Sửa thông tin
                </Button>
                <Button
                  onClick={() => openDeleteConfirm(selectedPatient!)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Xóa bệnh nhân
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Xem lịch sử
                </Button>
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

      {/* Form thêm bệnh nhân */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">THÊM BỆNH NHÂN MỚI</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPatient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-neutral-300">
                      Họ và tên *
                    </Label>
                    <Input
                      id="name"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age" className="text-neutral-300">
                      Tuổi *
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={addFormData.age}
                      onChange={(e) => setAddFormData({ ...addFormData, age: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                      min="1"
                      max="120"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-neutral-300">Số phòng *</Label>
                    <Select value={addFormData.room_number} onValueChange={(value) => handleRoomChange(value)} required>
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomNumbers.map((room) => (
                          <SelectItem key={room} value={room}>
                            Phòng {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-neutral-300">Giường *</Label>
                    <Select
                      value={addFormData.bed_number}
                      onValueChange={(value) => setAddFormData({ ...addFormData, bed_number: value })}
                      required
                      disabled={!addFormData.room_number}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Chọn giường" />
                      </SelectTrigger>
                      <SelectContent>
                        {addFormData.room_number &&
                          availableBeds[addFormData.room_number]?.map((bed) => (
                            <SelectItem key={bed} value={bed}>
                              Giường {bed}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="admission_date" className="text-neutral-300">
                      Ngày nhập viện *
                    </Label>
                    <Input
                      id="admission_date"
                      type="date"
                      value={addFormData.admission_date}
                      onChange={(e) => setAddFormData({ ...addFormData, admission_date: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="condition" className="text-neutral-300">
                    Chẩn đoán
                  </Label>
                  <Input
                    id="condition"
                    value={addFormData.condition}
                    onChange={(e) => setAddFormData({ ...addFormData, condition: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white"
                    placeholder="Ví dụ: Tiểu đường type 2, Cao huyết áp..."
                  />
                </div>

                <div>
                  <Label className="text-neutral-300">Bác sĩ điều trị</Label>
                  <Select
                    value={addFormData.doctor_name}
                    onValueChange={(value) => setAddFormData({ ...addFormData, doctor_name: value })}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                      <SelectValue placeholder="Chọn bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.name}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact" className="text-neutral-300">
                      Liên hệ khẩn cấp
                    </Label>
                    <Input
                      id="emergency_contact"
                      value={addFormData.emergency_contact}
                      onChange={(e) => setAddFormData({ ...addFormData, emergency_contact: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      placeholder="Số điện thoại người nhà"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-300">Trạng thái</Label>
                    <Select
                      value={addFormData.status}
                      onValueChange={(value) => setAddFormData({ ...addFormData, status: value })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stable">Ổn định</SelectItem>
                        <SelectItem value="monitoring">Theo dõi</SelectItem>
                        <SelectItem value="critical">Nguy hiểm</SelectItem>
                        <SelectItem value="recovering">Đang hồi phục</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                    Thêm bệnh nhân
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAddForm(false)}
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

      {/* Form sửa bệnh nhân */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">SỬA THÔNG TIN BỆNH NHÂN</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditPatient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name" className="text-neutral-300">
                      Họ và tên *
                    </Label>
                    <Input
                      id="edit-name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-age" className="text-neutral-300">
                      Tuổi *
                    </Label>
                    <Input
                      id="edit-age"
                      type="number"
                      value={editFormData.age}
                      onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                      min="1"
                      max="120"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-neutral-300">Số phòng *</Label>
                    <Select
                      value={editFormData.room_number}
                      onValueChange={(value) => handleRoomChange(value, true)}
                      required
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomNumbers.map((room) => (
                          <SelectItem key={room} value={room}>
                            Phòng {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-neutral-300">Giường *</Label>
                    <Select
                      value={editFormData.bed_number}
                      onValueChange={(value) => setEditFormData({ ...editFormData, bed_number: value })}
                      required
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Chọn giường" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Hiển thị giường hiện tại + giường trống */}
                        <SelectItem value={editFormData.bed_number}>
                          Giường {editFormData.bed_number} (hiện tại)
                        </SelectItem>
                        {editFormData.room_number &&
                          availableBeds[editFormData.room_number]?.map((bed) => (
                            <SelectItem key={bed} value={bed}>
                              Giường {bed}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-admission_date" className="text-neutral-300">
                      Ngày nhập viện *
                    </Label>
                    <Input
                      id="edit-admission_date"
                      type="date"
                      value={editFormData.admission_date}
                      onChange={(e) => setEditFormData({ ...editFormData, admission_date: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-condition" className="text-neutral-300">
                    Chẩn đoán
                  </Label>
                  <Input
                    id="edit-condition"
                    value={editFormData.condition}
                    onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white"
                    placeholder="Ví dụ: Tiểu đường type 2, Cao huyết áp..."
                  />
                </div>

                <div>
                  <Label className="text-neutral-300">Bác sĩ điều trị</Label>
                  <Select
                    value={editFormData.doctor_name}
                    onValueChange={(value) => setEditFormData({ ...editFormData, doctor_name: value })}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                      <SelectValue placeholder="Chọn bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.name}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-emergency_contact" className="text-neutral-300">
                      Liên hệ khẩn cấp
                    </Label>
                    <Input
                      id="edit-emergency_contact"
                      value={editFormData.emergency_contact}
                      onChange={(e) => setEditFormData({ ...editFormData, emergency_contact: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      placeholder="Số điện thoại người nhà"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-300">Trạng thái</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stable">Ổn định</SelectItem>
                        <SelectItem value="monitoring">Theo dõi</SelectItem>
                        <SelectItem value="critical">Nguy hiểm</SelectItem>
                        <SelectItem value="recovering">Đang hồi phục</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                    Cập nhật thông tin
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowEditForm(false)}
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

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm && patientToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">XÁC NHẬN XÓA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-white mb-2">Bạn có chắc chắn muốn xóa bệnh nhân</p>
                <p className="text-orange-500 font-bold text-lg">{patientToDelete.name}</p>
                <p className="text-neutral-400 text-sm mt-1">
                  {patientToDelete.patient_code} • Phòng {patientToDelete.room_number} • Giường{" "}
                  {patientToDelete.bed_number}
                </p>
                <p className="text-red-400 text-sm mt-4">⚠️ Hành động này không thể hoàn tác!</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleDeletePatient} className="bg-red-500 hover:bg-red-600 text-white flex-1">
                  Xóa bệnh nhân
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setPatientToDelete(null)
                  }}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white flex-1"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
