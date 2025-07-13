"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit2, Trash2, Pill, AlertTriangle, Package } from "lucide-react"

interface Medication {
  id: string
  name: string
  dosage: string
  description: string
  side_effects?: string
  contraindications?: string
  stock_quantity: number
  unit: string
  min_stock_alert: number
  created_at: string
  updated_at: string
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    description: "",
    side_effects: "",
    contraindications: "",
    stock_quantity: 0,
    unit: "viên",
    min_stock_alert: 10,
  })

  useEffect(() => {
    fetchMedications()
  }, [])

  useEffect(() => {
    const filtered = medications.filter(
      (med) =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.dosage.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredMedications(filtered)
  }, [medications, searchTerm])

  const fetchMedications = async () => {
    try {
      const response = await fetch("/api/medications")
      if (response.ok) {
        const data = await response.json()
        setMedications(data)
      }
    } catch (error) {
      console.error("Error fetching medications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingMedication ? `/api/medications/${editingMedication.id}` : "/api/medications"

      const response = await fetch(url, {
        method: editingMedication ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchMedications()
        resetForm()
      }
    } catch (error) {
      console.error("Error saving medication:", error)
    }
  }

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication)
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      description: medication.description,
      side_effects: medication.side_effects || "",
      contraindications: medication.contraindications || "",
      stock_quantity: medication.stock_quantity,
      unit: medication.unit,
      min_stock_alert: medication.min_stock_alert,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thuốc này?")) {
      try {
        const response = await fetch(`/api/medications/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          await fetchMedications()
        }
      } catch (error) {
        console.error("Error deleting medication:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      description: "",
      side_effects: "",
      contraindications: "",
      stock_quantity: 0,
      unit: "viên",
      min_stock_alert: 10,
    })
    setEditingMedication(null)
    setShowForm(false)
  }

  const getStockStatus = (med: Medication) => {
    if (med.stock_quantity === 0) return { color: "bg-red-500/20 text-red-500", text: "HẾT HÀNG" }
    if (med.stock_quantity <= med.min_stock_alert) return { color: "bg-orange-500/20 text-orange-500", text: "SẮP HẾT" }
    return { color: "bg-white/20 text-white", text: "ĐỦ HÀNG" }
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
          <h1 className="text-2xl font-bold text-white tracking-wider">QUẢN LÝ THUỐC</h1>
          <p className="text-sm text-neutral-400">Quản lý kho thuốc và thông tin thuốc</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Thêm thuốc mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TỔNG LOẠI THUỐC</p>
                <p className="text-2xl font-bold text-white font-mono">{medications.length}</p>
              </div>
              <Pill className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SẮP HẾT HÀNG</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {medications.filter((m) => m.stock_quantity <= m.min_stock_alert && m.stock_quantity > 0).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">HẾT HÀNG</p>
                <p className="text-2xl font-bold text-red-500 font-mono">
                  {medications.filter((m) => m.stock_quantity === 0).length}
                </p>
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TỔNG TỒN KHO</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {medications.reduce((sum, m) => sum + m.stock_quantity, 0)}
                </p>
              </div>
              <Package className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Tìm thuốc theo tên hoặc liều lượng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMedications.map((medication) => {
          const stockStatus = getStockStatus(medication)
          return (
            <Card
              key={medication.id}
              className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Pill className="w-6 h-6 text-orange-500" />
                    <div>
                      <CardTitle className="text-lg font-bold text-white">{medication.name}</CardTitle>
                      <p className="text-sm text-neutral-400">{medication.dosage}</p>
                    </div>
                  </div>
                  <Badge className={stockStatus.color}>{stockStatus.text}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-400 mb-1">MÔ TẢ</p>
                  <p className="text-sm text-white">{medication.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-neutral-400">Tồn kho</div>
                    <div className="text-white font-mono">
                      {medication.stock_quantity} {medication.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Cảnh báo</div>
                    <div className="text-white font-mono">
                      {medication.min_stock_alert} {medication.unit}
                    </div>
                  </div>
                </div>

                {medication.side_effects && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">TÁC DỤNG PHỤ</p>
                    <p className="text-xs text-red-400">{medication.side_effects}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-neutral-700">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(medication)}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white flex-1"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(medication.id)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 flex-1"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">
                {editingMedication ? "CẬP NHẬT THUỐC" : "THÊM THUỐC MỚI"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-neutral-300">
                      Tên thuốc *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dosage" className="text-neutral-300">
                      Liều lượng *
                    </Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-neutral-300">
                    Mô tả
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="side_effects" className="text-neutral-300">
                    Tác dụng phụ
                  </Label>
                  <Textarea
                    id="side_effects"
                    value={formData.side_effects}
                    onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="contraindications" className="text-neutral-300">
                    Chống chỉ định
                  </Label>
                  <Textarea
                    id="contraindications"
                    value={formData.contraindications}
                    onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stock_quantity" className="text-neutral-300">
                      Số lượng tồn kho
                    </Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stock_quantity: Number.parseInt(e.target.value) || 0 })
                      }
                      className="bg-neutral-800 border-neutral-600 text-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit" className="text-neutral-300">
                      Đơn vị
                    </Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_stock_alert" className="text-neutral-300">
                      Cảnh báo tồn kho
                    </Label>
                    <Input
                      id="min_stock_alert"
                      type="number"
                      value={formData.min_stock_alert}
                      onChange={(e) =>
                        setFormData({ ...formData, min_stock_alert: Number.parseInt(e.target.value) || 0 })
                      }
                      className="bg-neutral-800 border-neutral-600 text-white"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                    {editingMedication ? "Cập nhật" : "Thêm thuốc"}
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
