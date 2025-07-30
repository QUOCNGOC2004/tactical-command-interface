import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: cabinetMeds, error } = await supabase
      .from("cabinet_medications")
      .select("id, medication_id, quantity, compartment_id")
      .eq("cabinet_id", params.id)

    if (error) throw error

    // Lấy thông tin chi tiết thuốc, trả về cả compartment_id
    const medications = []
    if (cabinetMeds) {
      for (const cabMed of cabinetMeds) {
        const { data: medDetail, error: medError } = await supabase
          .from("medications")
          .select("id, name, dosage, unit")
          .eq("id", cabMed.medication_id)
          .single()

        if (!medError && medDetail) {
          medications.push({
            id: cabMed.id,
            quantity: cabMed.quantity,
            compartment_id: cabMed.compartment_id,
            medications: medDetail,
          })
        }
      }
    }

    return NextResponse.json(medications)
  } catch (error) {
    console.error("Error fetching cabinet medications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { medication_id, quantity, compartment_id } = body

    // Kiểm tra thuốc có tồn tại trong kho không
    const { data: medication, error: medError } = await supabase
      .from("medications")
      .select("stock_quantity")
      .eq("id", medication_id)
      .single()

    if (medError || !medication) {
      return NextResponse.json({ error: "Thuốc không tồn tại" }, { status: 400 })
    }

    if (medication.stock_quantity < quantity) {
      return NextResponse.json(
        {
          error: `Không đủ thuốc trong kho. Còn lại: ${medication.stock_quantity}`,
        },
        { status: 400 },
      )
    }

    // Kiểm tra thuốc đã có trong ngăn này chưa
    const { data: existingMed, error: existingError } = await supabase
      .from("cabinet_medications")
      .select("*")
      .eq("cabinet_id", params.id)
      .eq("medication_id", medication_id)
      .eq("compartment_id", compartment_id)
      .single()

    if (existingMed) {
      // Cập nhật số lượng nếu đã có
      const { data: updatedMed, error: updateError } = await supabase
        .from("cabinet_medications")
        .update({ quantity: existingMed.quantity + quantity })
        .eq("id", existingMed.id)
        .select()
        .single()

      if (updateError) throw updateError
    } else {
      // Thêm mới nếu chưa có
      const { data: newMed, error: insertError } = await supabase
        .from("cabinet_medications")
        .insert({
          cabinet_id: params.id,
          medication_id: medication_id,
          quantity: quantity,
          compartment_id: compartment_id,
        })
        .select()
        .single()

      if (insertError) throw insertError
    }

    // Trừ số lượng trong kho
    const { error: stockError } = await supabase
      .from("medications")
      .update({ stock_quantity: medication.stock_quantity - quantity })
      .eq("id", medication_id)

    if (stockError) throw stockError

    return NextResponse.json({ success: true, message: "Đã thêm thuốc vào tủ thành công" })
  } catch (error) {
    console.error("Error adding medication to cabinet:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
