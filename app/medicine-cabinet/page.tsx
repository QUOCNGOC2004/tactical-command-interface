"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pill, Lock, Bed, Clock, Package, X, Plus, Edit, Trash2, RefreshCw } from "lucide-react"

interface MedicineCabinet {
  id: string
  cabinet_code: string
  room_number: string
  bed_number: string
  status: string
  patient: {
    id: string
    name: string
    patient_code: string
    room_number?: string
    bed_number?: string
  } | null
}

interface MedicationSchedule {
  id: string
  patient_name: string
  room_number: string
  bed_number: string
  medication_name: string
  scheduled_time: string
  status: string
  dosage_amount: number
}

interface InventoryItem {
  name: string
  stock: number
  percentage: number
  color: string
}

interface CabinetDetail {
  id: string
  cabinet_code: string
  room_number: string
  bed_number: string
  status: string
  patient: {
    id: string
    name: string
    patient_code: string
    room_number?: string
    bed_number?: string
  } | null
  medications: Array<{
    id: string
    quantity: number
    medications: {
      id: string
      name: string
      dosage: string
      unit: string
    }
  }>
  todaySchedules: Array<{
    id: string
    time: string
    status: string
    dosage_amount: number
    medications: {
      name: string
      dosage: string
    }
  }>
}

interface Medication {
  id: string
  name: string
  dosage: string
  unit: string
  stock_quantity: number
}

export default function MedicineCabinetPage() {
  const [cabinets, setCabinets] = useState<MedicineCabinet[]>([])
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedCabinet, setSelectedCabinet] = useState<CabinetDetail | null>(null)
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([])
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [editingMedication, setEditingMedication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoDispenseLoading, setAutoDispenseLoading] = useState(false)
  const [showAssignPatient, setShowAssignPatient] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [assigning, setAssigning] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState("")

  // Form states
  const [selectedMedicationId, setSelectedMedicationId] = useState("")
  const [addQuantity, setAddQuantity] = useState("")
  const [editQuantity, setEditQuantity] = useState("")

  useEffect(() => {
    fetchCabinets()
    fetchSchedules()
    fetchInventory()
    fetchAvailableMedications()

    // Tự động kiểm tra và phát thuốc mỗi phút
    const interval = setInterval(() => {
      autoDispenseMedications()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showAssignPatient) fetchPatients()
  }, [showAssignPatient])

  const fetchCabinets = async () => {
    try {
      const response = await fetch("/api/medicine-cabinets")
      if (response.ok) {
        const data = await response.json()
        setCabinets(data)
      }
    } catch (error) {
      console.error("Error fetching cabinets:", error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/medication-schedules/today")
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/medication-inventory")
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      } else {
        // Fallback to mock data if API fails
        setInventory([
          { name: "Paracetamol", stock: 85, percentage: 85, color: "bg-white" },
          { name: "Aspirin", stock: 92, percentage: 92, color: "bg-white" },
          { name: "Metformin", stock: 67, percentage: 67, color: "bg-orange-500" },
          { name: "Vitamin D3", stock: 45, percentage: 45, color: "bg-orange-500" },
          { name: "Omeprazole", stock: 23, percentage: 23, color: "bg-red-500" },
          { name: "Atorvastatin", stock: 78, percentage: 78, color: "bg-white" },
        ])
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
      setInventory([
        { name: "Paracetamol", stock: 85, percentage: 85, color: "bg-white" },
        { name: "Aspirin", stock: 92, percentage: 92, color: "bg-white" },
        { name: "Metformin", stock: 67, percentage: 67, color: "bg-orange-500" },
        { name: "Vitamin D3", stock: 45, percentage: 45, color: "bg-orange-500" },
        { name: "Omeprazole", stock: 23, percentage: 23, color: "bg-red-500" },
        { name: "Atorvastatin", stock: 78, percentage: 78, color: "bg-white" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableMedications = async () => {
    try {
      const response = await fetch("/api/medications")
      if (response.ok) {
        const data = await response.json()
        setAvailableMedications(data)
      }
    } catch (error) {
      console.error("Error fetching available medications:", error)
    }
  }

  const fetchCabinetDetail = async (cabinetId: string) => {
    try {
      const response = await fetch(`/api/medicine-cabinets/${cabinetId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedCabinet(data)
      }
    } catch (error) {
      console.error("Error fetching cabinet detail:", error)
    }
  }

  const autoDispenseMedications = async () => {
    try {
      setAutoDispenseLoading(true)
      const response = await fetch("/api/medication-schedules/auto-dispense", {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        if (result.processedCount > 0) {
          // Refresh data if any medications were dispensed
          fetchSchedules()
          fetchInventory()
          if (selectedCabinet) {
            fetchCabinetDetail(selectedCabinet.id)
          }
        }
      }
    } catch (error) {
      console.error("Error in auto-dispense:", error)
    } finally {
      setAutoDispenseLoading(false)
    }
  }

  const addMedicationToCabinet = async () => {
    if (!selectedCabinet || !selectedMedicationId || !addQuantity) return

    try {
      const response = await fetch(`/api/medicine-cabinets/${selectedCabinet.id}/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medication_id: selectedMedicationId,
          quantity: Number.parseInt(addQuantity),
        }),
      })

      if (response.ok) {
        fetchCabinetDetail(selectedCabinet.id)
        fetchAvailableMedications()
        setShowAddMedication(false)
        setSelectedMedicationId("")
        setAddQuantity("")
        alert("Đã thêm thuốc vào tủ thành công!")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Có lỗi xảy ra khi thêm thuốc")
      }
    } catch (error) {
      console.error("Error adding medication:", error)
      alert("Có lỗi xảy ra khi thêm thuốc")
    }
  }

  const updateMedicationQuantity = async () => {
    if (!editingMedication || !editQuantity) return

    try {
      const response = await fetch(
        `/api/medicine-cabinets/${selectedCabinet?.id}/medications/${editingMedication.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: Number.parseInt(editQuantity),
          }),
        },
      )

      if (response.ok) {
        fetchCabinetDetail(selectedCabinet!.id)
        fetchAvailableMedications()
        setEditingMedication(null)
        setEditQuantity("")
        alert("Đã cập nhật số lượng thuốc thành công!")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Có lỗi xảy ra khi cập nhật thuốc")
      }
    } catch (error) {
      console.error("Error updating medication:", error)
      alert("Có lỗi xảy ra khi cập nhật thuốc")
    }
  }

  const deleteMedicationFromCabinet = async (medicationId: string) => {
    if (!selectedCabinet) return

    if (!confirm("Bạn có chắc chắn muốn xóa thuốc này khỏi tủ?")) return

    try {
      const response = await fetch(`/api/medicine-cabinets/${selectedCabinet.id}/medications/${medicationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCabinetDetail(selectedCabinet.id)
        fetchAvailableMedications()
        alert("Đã xóa thuốc khỏi tủ thành công!")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Có lỗi xảy ra khi xóa thuốc")
      }
    } catch (error) {
      console.error("Error deleting medication:", error)
      alert("Có lỗi xảy ra khi xóa thuốc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "locked":
        return "bg-white/20 text-white"
      case "open":
        return "bg-orange-500/20 text-orange-500"
      case "error":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "locked":
        return "KHÓA"
      case "open":
        return "MỞ"
      case "error":
        return "LỖI"
      default:
        return "KHÔNG XÁC ĐỊNH"
    }
  }

  const getScheduleStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "taken":
        return "border-white"
      case "dispensing":
        return "border-orange-500"
      case "pending":
        return "border-red-500"
      case "scheduled":
        return "border-neutral-500"
      default:
        return "border-neutral-600"
    }
  }

  const getScheduleStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "taken":
        return "bg-green-500/20 text-green-500"
      case "dispensing":
        return "bg-orange-500/20 text-orange-500"
      case "pending":
        return "bg-red-500/20 text-red-500"
      case "scheduled":
        return "bg-neutral-500/20 text-neutral-300"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getScheduleStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "taken":
        return "Đã uống"
      case "dispensing":
        return "Đang phát"
      case "pending":
        return "Chờ uống"
      case "scheduled":
        return "Đã lên lịch"
      default:
        return "Không xác định"
    }
  }

  const fetchPatients = async () => {
    const res = await fetch("/api/patients")
    if (res.ok) {
      const data = await res.json()
      setPatients(data)
    }
  }

  const handleAssignPatient = async () => {
    if (!selectedCabinet || !selectedPatientId) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/medicine-cabinets/${selectedCabinet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: selectedPatientId })
      })
      if (res.ok) {
        setShowAssignPatient(false)
        setSelectedPatientId("")
        fetchCabinetDetail(selectedCabinet.id)
        fetchCabinets()
      } else {
        alert("Có lỗi khi gán bệnh nhân")
      }
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignPatient = async () => {
    if (!selectedCabinet) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/medicine-cabinets/${selectedCabinet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: null })
      })
      if (res.ok) {
        fetchCabinetDetail(selectedCabinet.id)
        fetchCabinets()
      } else {
        alert("Có lỗi khi bỏ gán bệnh nhân")
      }
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-neutral-800 h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  const activeCabinets = cabinets.filter((c) => c.status !== "error")
  const openCabinets = cabinets.filter((c) => c.status === "open")
  const errorCabinets = cabinets.filter((c) => c.status === "error")

  return (
    <div className="p-6 space-y-6">
      {/* Auto-dispense status */}
      {autoDispenseLoading && (
        <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
          <span className="text-orange-500 text-sm">Đang kiểm tra và phát thuốc tự động...</span>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Medicine Cabinet Status */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TRẠNG THÁI TỦ THUỐC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">{activeCabinets.length}</div>
                <div className="text-xs text-neutral-500">Hoạt động</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500 font-mono">{openCabinets.length}</div>
                <div className="text-xs text-neutral-500">Đang mở</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500 font-mono">{errorCabinets.length}</div>
                <div className="text-xs text-neutral-500">Lỗi</div>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {cabinets.length > 0 ? (
                cabinets.map((cabinet, idx) => (
                  <div
                    key={cabinet.id}
                    className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                    onClick={() => fetchCabinetDetail(cabinet.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          cabinet.status === "locked"
                            ? "bg-white"
                            : cabinet.status === "open"
                              ? "bg-orange-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <div>
                        <div className="text-xs text-white font-mono">Tủ thuốc {idx + 1}</div>
                        {/* Chỉ hiện vị trí nếu đã gán bệnh nhân */}
                        {cabinet.patient && cabinet.patient.room_number && cabinet.patient.bed_number ? (
                          <div className="text-xs text-neutral-500 flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            Phòng {cabinet.patient.room_number} - Giường {cabinet.patient.bed_number}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      {cabinet.patient ? (
                        <>
                          <div className="text-xs text-white">{cabinet.patient.name}</div>
                          <div className="text-xs text-neutral-500">{cabinet.patient.patient_code}</div>
                        </>
                      ) : (
                        <div className="text-xs text-neutral-500">Chưa gán bệnh nhân</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-neutral-500 py-8">
                  <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có tủ thuốc nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medication Schedule */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              LỊCH UỐNG THUỐC HÔM NAY
            </CardTitle>
            <Button
              size="sm"
              onClick={autoDispenseMedications}
              disabled={autoDispenseLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
            >
              {autoDispenseLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {schedules.length > 0 ? (
                schedules.map((schedule, index) => (
                  <div
                    key={index}
                    className={`text-xs border-l-2 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors ${getScheduleStatusColor(
                      schedule.status,
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-neutral-500 font-mono">
                        {new Date(schedule.scheduled_time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <Badge className={getScheduleStatusBadge(schedule.status)}>
                        {getScheduleStatusText(schedule.status)}
                      </Badge>
                    </div>
                    <div className="text-white">
                      <span className="text-orange-500 font-mono">{schedule.patient_name}</span> - Phòng{" "}
                      {schedule.room_number} - Giường {schedule.bed_number}
                    </div>
                    <div className="text-neutral-400">{schedule.medication_name}</div>
                    <div className="text-xs text-neutral-500">Số lượng: {schedule.dosage_amount}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-neutral-500 py-8">
                  <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có lịch uống thuốc hôm nay</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RFID Access Log */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">NHẬT KÝ TRUY CẬP RFID</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* RFID Scanner Visual */}
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 border-2 border-white rounded-lg opacity-60 animate-pulse"></div>
              <div className="absolute inset-2 border border-white rounded-lg opacity-40"></div>
              <div className="absolute inset-4 border border-white rounded-lg opacity-20"></div>
              {/* Scanner lines */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-white opacity-30"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-px h-full bg-white opacity-30"></div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 space-y-1 w-full font-mono">
              <div className="flex justify-between">
                <span>
                  # {new Date().toISOString().split("T")[0]} {new Date().toTimeString().split(" ")[0]} UTC
                </span>
              </div>
              <div className="text-white">
                {"> [RFID:A7B2C4] ::: ACCESS >> ^^^ Tủ thuốc "}
                {cabinets.find((c) => c.status === "open")?.cabinet_code || "CAB-101A"}
              </div>
              <div className="text-orange-500">{"> USER | Y tá Nguyễn Thị C"}</div>
              <div className="text-white">{"> STATUS >> GRANTED"}</div>
              <div className="text-neutral-400">
                {'> ACTION >> "Phát thuốc cho bệnh nhân '}
                {cabinets.find((c) => c.status === "open")?.patient?.name || "Nguyễn Văn A"}
                {'"'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medicine Inventory Chart */}
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">BIỂU ĐỒ TỒN KHO THUỐC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Bars */}
              <div className="absolute inset-0 flex items-end justify-around px-4">
                {inventory.slice(0, 6).map((med, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs text-neutral-300 mb-1 font-mono">{med.stock}</div>
                    <div
                      className={`w-8 ${med.color} transition-all duration-300`}
                      style={{ height: `${(med.percentage / 100) * 160}px` }}
                    ></div>
                    <div className="text-xs text-neutral-400 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                      {med.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-8 font-mono">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cabinet Control Panel */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ĐIỀU KHIỂN TỦ THUỐC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-white" />
                  <span className="text-xs text-white font-medium">Trạng thái khóa</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Tủ đã khóa</span>
                    <span className="text-white font-bold font-mono">
                      {cabinets.filter((c) => c.status === "locked").length}/{cabinets.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Tủ đang mở</span>
                    <span className="text-orange-500 font-bold font-mono">
                      {openCabinets.length}/{cabinets.length}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="w-4 h-4 text-white" />
                  <span className="text-xs text-white font-medium">Phát thuốc tự động</span>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={autoDispenseMedications}
                    disabled={autoDispenseLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs"
                  >
                    {autoDispenseLoading ? "Đang xử lý..." : "Kiểm tra phát thuốc ngay"}
                  </Button>
                  <Button className="w-full bg-neutral-700 hover:bg-neutral-600 text-white text-xs">
                    Mở tủ thủ công
                  </Button>
                  <Button className="w-full bg-neutral-700 hover:bg-neutral-600 text-white text-xs">
                    Khóa tất cả tủ
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cabinet Detail Modal - z-index 50 */}
      {selectedCabinet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">
                  TỦ THUỐC {cabinets.findIndex(c => c.id === selectedCabinet.id) + 1}
                </CardTitle>
                {/* Chỉ hiện vị trí nếu đã gán bệnh nhân */}
                {selectedCabinet.patient && selectedCabinet.patient.room_number && selectedCabinet.patient.bed_number ? (
                  <p className="text-sm text-neutral-400">
                    Phòng {selectedCabinet.patient.room_number} - Giường {selectedCabinet.patient.bed_number}
                  </p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedCabinet(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin tủ thuốc */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">THÔNG TIN TỦ THUỐC</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Trạng thái:</span>
                        <Badge className={getStatusColor(selectedCabinet.status)}>
                          {getStatusText(selectedCabinet.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Vị trí:</span>
                        <span className="text-white">
                          {selectedCabinet.patient && selectedCabinet.patient.room_number && selectedCabinet.patient.bed_number ? (
                            <>
                              {selectedCabinet.patient.name} - Phòng {selectedCabinet.patient.room_number} - Giường {selectedCabinet.patient.bed_number}
                            </>
                          ) : (
                            <span className="text-neutral-500">Chưa có thông tin</span>
                          )}
                        </span>
                      </div>
                      {selectedCabinet.patient && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Bệnh nhân:</span>
                            <span className="text-white">{selectedCabinet.patient.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Mã bệnh nhân:</span>
                            <span className="text-white font-mono">{selectedCabinet.patient.patient_code}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thuốc trong tủ */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider">THUỐC TRONG TỦ</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowAddMedication(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Thêm thuốc
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCabinet.medications.length > 0 ? (
                      selectedCabinet.medications.map((med) => (
                        <div key={med.id} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="text-sm text-white">{med.medications.name}</div>
                              <div className="text-xs text-neutral-400">{med.medications.dosage}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm text-white font-mono">{med.quantity}</div>
                              <div className="text-xs text-neutral-400">{med.medications.unit || "viên"}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMedication(med)
                                  setEditQuantity(med.quantity.toString())
                                }}
                                className="text-neutral-400 hover:text-white p-1 h-6 w-6"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMedicationFromCabinet(med.id)}
                                className="text-red-400 hover:text-red-300 p-1 h-6 w-6"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-neutral-500 py-4">
                        <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Chưa có thuốc trong tủ</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lịch uống thuốc hôm nay */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      LỊCH UỐNG THUỐC HÔM NAY
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedCabinet.todaySchedules.length > 0 ? (
                        selectedCabinet.todaySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`p-2 bg-neutral-800 rounded border-l-2 ${getScheduleStatusColor(
                              schedule.status,
                            )}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs text-neutral-500 font-mono">
                                {new Date(schedule.time).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <Badge className={getScheduleStatusBadge(schedule.status)}>
                                {getScheduleStatusText(schedule.status)}
                              </Badge>
                            </div>
                            <div className="text-sm text-white">{schedule.medications.name}</div>
                            <div className="text-xs text-neutral-400">
                              {schedule.medications.dosage} × {schedule.dosage_amount}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-neutral-500 py-4">
                          <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Chưa có lịch uống thuốc hôm nay</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                {!selectedCabinet.patient && (
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white mt-2" onClick={() => setShowAssignPatient(true)}>
                    Chọn bệnh nhân
                  </Button>
                )}
                {selectedCabinet.patient && (
                  <Button size="sm" className="bg-neutral-700 hover:bg-neutral-600 text-white mt-2" onClick={handleUnassignPatient} disabled={assigning}>
                    Bỏ gán bệnh nhân
                  </Button>
                )}
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Lock className="w-4 h-4 mr-2" />
                  Mở tủ thuốc
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Khóa tủ thuốc
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Medication Modal - z-index 60 */}
      {showAddMedication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white">THÊM THUỐC VÀO TỦ</CardTitle>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddMedication(false)
                  setSelectedMedicationId("")
                  setAddQuantity("")
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medication" className="text-sm text-neutral-300">
                  Chọn thuốc
                </Label>
                <select
                  id="medication"
                  value={selectedMedicationId}
                  onChange={(e) => setSelectedMedicationId(e.target.value)}
                  className="w-full mt-1 p-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                >
                  <option value="">-- Chọn thuốc --</option>
                  {availableMedications
                    .filter((med) => med.stock_quantity > 0)
                    .map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} - {med.dosage} (Còn: {med.stock_quantity} {med.unit})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label htmlFor="quantity" className="text-sm text-neutral-300">
                  Số lượng
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                  placeholder="Nhập số lượng"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={addMedicationToCabinet}
                  disabled={!selectedMedicationId || !addQuantity}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Thêm thuốc
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMedication(false)
                    setSelectedMedicationId("")
                    setAddQuantity("")
                  }}
                  className="flex-1 border-neutral-700 text-neutral-400 hover:bg-neutral-800 bg-transparent"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Medication Modal - z-index 60 */}
      {editingMedication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white">CHỈNH SỬA SỐ LƯỢNG</CardTitle>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingMedication(null)
                  setEditQuantity("")
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-neutral-300">Thuốc</Label>
                <div className="mt-1 p-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm">
                  {editingMedication.medications.name} - {editingMedication.medications.dosage}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-quantity" className="text-sm text-neutral-300">
                  Số lượng mới
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                  placeholder="Nhập số lượng mới"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={updateMedicationQuantity}
                  disabled={!editQuantity}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Cập nhật
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingMedication(null)
                    setEditQuantity("")
                  }}
                  className="flex-1 border-neutral-700 text-neutral-400 hover:bg-neutral-800 bg-transparent"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Patient Modal - z-index 60 */}
      {showAssignPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white">Chọn bệnh nhân</CardTitle>
              <Button variant="ghost" onClick={() => setShowAssignPatient(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                id="patient"
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full mt-1 p-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
              >
                <option value="">-- Chọn bệnh nhân --</option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} - Phòng {p.room_number} - Giường {p.bed_number}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAssignPatient} disabled={!selectedPatientId || assigning} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                  Gán
                </Button>
                <Button variant="outline" onClick={() => setShowAssignPatient(false)} className="flex-1 border-neutral-700 text-neutral-400 hover:bg-neutral-800 bg-transparent">
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
