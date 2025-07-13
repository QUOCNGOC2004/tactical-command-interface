import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    // Lấy thông tin lịch uống thuốc
    const { data: schedule, error: scheduleError } = await supabase
      .from("medication_schedules")
      .select(`
        id,
        patient_id,
        medication_id,
        dosage_amount,
        status,
        patients!inner(room_number, bed_number, name),
        medications!inner(name)
      `)
      .eq("id", params.id)
      .single()

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: "Không tìm thấy lịch uống thuốc" }, { status: 404 })
    }

    if (schedule.status !== "pending" && schedule.status !== "scheduled") {
      return NextResponse.json({ error: "Lịch uống thuốc này đã được xử lý" }, { status: 400 })
    }

    // Tìm tủ thuốc tương ứng
    const { data: cabinet, error: cabinetError } = await supabase
      .from("medicine_cabinets")
      .select("id")
      .eq("room_number", schedule.patients.room_number)
      .eq("bed_number", schedule.patients.bed_number)
      .single()

    if (cabinetError || !cabinet) {
      return NextResponse.json(
        {
          error: `Không tìm thấy tủ thuốc cho phòng ${schedule.patients.room_number} giường ${schedule.patients.bed_number}`,
        },
        { status: 404 },
      )
    }

    // Kiểm tra thuốc trong tủ
    const { data: cabinetMed, error: cabinetMedError } = await supabase
      .from("cabinet_medications")
      .select("quantity")
      .eq("cabinet_id", cabinet.id)
      .eq("medication_id", schedule.medication_id)
      .single()

    if (cabinetMedError || !cabinetMed) {
      return NextResponse.json(
        {
          error: `Thuốc ${schedule.medications.name} không có trong tủ`,
        },
        { status: 400 },
      )
    }

    if (cabinetMed.quantity < schedule.dosage_amount) {
      return NextResponse.json(
        {
          error: `Không đủ thuốc trong tủ. Cần: ${schedule.dosage_amount}, Có: ${cabinetMed.quantity}`,
        },
        { status: 400 },
      )
    }

    // Trừ thuốc trong tủ
    const { error: updateCabinetError } = await supabase
      .from("cabinet_medications")
      .update({ quantity: cabinetMed.quantity - schedule.dosage_amount })
      .eq("cabinet_id", cabinet.id)
      .eq("medication_id", schedule.medication_id)

    if (updateCabinetError) throw updateCabinetError

    // Cập nhật trạng thái lịch
    const { error: updateScheduleError } = await supabase
      .from("medication_schedules")
      .update({
        status: "taken",
        dispensed_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateScheduleError) throw updateScheduleError

    return NextResponse.json({
      success: true,
      message: `Đã phát thuốc ${schedule.medications.name} cho bệnh nhân ${schedule.patients.name}`,
    })
  } catch (error) {
    console.error("Error dispensing medication:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
