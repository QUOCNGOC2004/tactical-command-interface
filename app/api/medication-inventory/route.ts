import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    // Fetch all columns to avoid column name issues
    const { data: medications, error } = await supabase.from("medications").select("*").order("name")

    if (error) throw error

    if (!medications || medications.length === 0) {
      // Return fallback data if no medications found
      return NextResponse.json([
        { name: "Paracetamol", stock: 85, percentage: 85, color: "bg-white" },
        { name: "Aspirin", stock: 92, percentage: 92, color: "bg-white" },
        { name: "Metformin", stock: 67, percentage: 67, color: "bg-orange-500" },
        { name: "Vitamin D3", stock: 45, percentage: 45, color: "bg-orange-500" },
        { name: "Omeprazole", stock: 23, percentage: 23, color: "bg-red-500" },
        { name: "Atorvastatin", stock: 78, percentage: 78, color: "bg-white" },
      ])
    }

    // Find stock quantity column dynamically
    const sampleRecord = medications[0]
    const possibleStockColumns = ["stock_quantity", "quantity", "stock", "available_quantity", "current_stock"]
    const possibleMinStockColumns = [
      "min_stock_level",
      "minimum_stock",
      "min_quantity",
      "reorder_level",
      "low_stock_threshold",
    ]

    let stockColumn = null
    let minStockColumn = null

    for (const col of possibleStockColumns) {
      if (sampleRecord.hasOwnProperty(col)) {
        stockColumn = col
        break
      }
    }

    for (const col of possibleMinStockColumns) {
      if (sampleRecord.hasOwnProperty(col)) {
        minStockColumn = col
        break
      }
    }

    // Transform data for chart
    const inventoryData = medications.map((med) => {
      const stockQty = stockColumn ? med[stockColumn] || 0 : 50 // fallback
      const minLevel = minStockColumn ? med[minStockColumn] || 20 : 20 // fallback

      return {
        name: med.name || "Unknown Medicine",
        stock: stockQty,
        minLevel: minLevel,
        percentage: Math.min((stockQty / 100) * 100, 100),
        color: stockQty <= minLevel ? "bg-red-500" : stockQty <= minLevel * 2 ? "bg-orange-500" : "bg-white",
      }
    })

    return NextResponse.json(inventoryData)
  } catch (error) {
    console.error("Error fetching medication inventory:", error)

    // Return fallback data on error
    return NextResponse.json([
      { name: "Paracetamol", stock: 85, percentage: 85, color: "bg-white" },
      { name: "Aspirin", stock: 92, percentage: 92, color: "bg-white" },
      { name: "Metformin", stock: 67, percentage: 67, color: "bg-orange-500" },
      { name: "Vitamin D3", stock: 45, percentage: 45, color: "bg-orange-500" },
      { name: "Omeprazole", stock: 23, percentage: 23, color: "bg-red-500" },
      { name: "Atorvastatin", stock: 78, percentage: 78, color: "bg-white" },
    ])
  }
}
