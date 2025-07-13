import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST() {
  const supabase = createServerClient()

  try {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    // Tìm các lịch uống thuốc đã đến giờ nhưng chưa được phát
    const { data: schedules, error: schedulesError } = await supabase
      .from("medication_schedules")
      .select(`
        id,
        patient_id,
        medication_id,
        dosage_amount,
        time_of_day,
        status,
        patients!inner(room_number, bed_number),
        medications!inner(name)
      `)
      .eq("status", "scheduled")
      .lte("time_of_day", currentTime)

    if (schedulesError) throw schedulesError

    let processedCount = 0

    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        // Tìm tủ thuốc tương ứng với bệnh nhân
        const { data: cabinet, error: cabinetError } = await supabase
          .from("medicine_cabinets")
          .select("id")
          .eq("room_number", schedule.patients.room_number)
          .eq("bed_number", schedule.patients.bed_number)
          .single()

        if (cabinetError || !cabinet) {
          console.log(
            `Không tìm thấy tủ thuốc cho bệnh nhân phòng ${schedule.patients.room_number} giường ${schedule.patients.bed_number}`,
          )
          continue
        }

        // Kiểm tra thuốc có trong tủ không
        const { data: cabinetMed, error: cabinetMedError } = await supabase
          .from("cabinet_medications")
          .select("quantity")
          .eq("cabinet_id", cabinet.id)
          .eq("medication_id", schedule.medication_id)
          .single()

        if (cabinetMedError || !cabinetMed) {
          console.log(`Thuốc ${schedule.medications.name} không có trong tủ`)
          continue
        }

        if (cabinetMed.quantity < schedule.dosage_amount) {
          console.log(
            `Không đủ thuốc ${schedule.medications.name} trong tủ. Cần: ${schedule.dosage_amount}, Có: ${cabinetMed.quantity}`,
          )
          continue
        }

        // Trừ thuốc trong tủ
        const { error: updateCabinetError } = await supabase
          .from("cabinet_medications")
          .update({ quantity: cabinetMed.quantity - schedule.dosage_amount })
          .eq("cabinet_id", cabinet.id)
          .eq("medication_id", schedule.medication_id)

        if (updateCabinetError) {
          console.error("Lỗi cập nhật thuốc trong tủ:", updateCabinetError)
          continue
        }

        // Cập nhật trạng thái lịch uống thuốc
        const { error: updateScheduleError } = await supabase
          .from("medication_schedules")
          .update({
            status: "taken",
            dispensed_at: now.toISOString(),
          })
          .eq("id", schedule.id)

        if (updateScheduleError) {
          console.error("Lỗi cập nhật trạng thái lịch:", updateScheduleError)
          continue
        }

        processedCount++
        console.log(
          `Đã phát thuốc ${schedule.medications.name} cho bệnh nhân phòng ${schedule.patients.room_number} giường ${schedule.patients.bed_number}`,
        )
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      message: `Đã xử lý ${processedCount} lịch uống thuốc`,
    })
  } catch (error) {
    console.error("Error in auto-dispense:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
