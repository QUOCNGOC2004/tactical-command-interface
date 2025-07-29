import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

/**
 * GET /api/patients/:id
 * Returns the patient together with the related medicine_cabinets.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: patient, error } = await supabase
      .from("patients")
      .select(
        `
        *,
        medicine_cabinets (
          id,
          cabinet_code,
          status,
          bed_number
        ),
        health_monitoring (
          heart_rate,
          blood_pressure_systolic,
          blood_pressure_diastolic,
          temperature,
          spo2,
          recorded_at
        )
      `,
      )
      .eq("id", params.id)
      .single()

    if (error || !patient) {
      throw error ?? new Error("Patient not found")
    }

    return NextResponse.json(patient)
  } catch (err) {
    console.error("Error fetching patient by ID:", err)
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }
}

/**
 * PUT /api/patients/:id
 * Updates patient information
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Lấy thông tin bệnh nhân hiện tại
    const { data: currentPatient } = await supabase
      .from("patients")
      .select("room_number, bed_number")
      .eq("id", params.id)
      .single()

    // Kiểm tra nếu thay đổi giường, giường mới có trống không
    if (
      currentPatient &&
      (body.room_number !== currentPatient.room_number || body.bed_number !== currentPatient.bed_number)
    ) {
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("room_number", body.room_number)
        .eq("bed_number", body.bed_number)
        .neq("id", params.id)
        .single()

      if (existingPatient) {
        return NextResponse.json(
          { error: `Giường ${body.bed_number} trong phòng ${body.room_number} đã có bệnh nhân` },
          { status: 400 },
        )
      }
    }

    // Cập nhật thông tin bệnh nhân
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (patientError) throw patientError

    // Cập nhật tủ thuốc nếu thay đổi phòng/giường
    if (
      currentPatient &&
      (body.room_number !== currentPatient.room_number || body.bed_number !== currentPatient.bed_number)
    ) {
      const newCabinetCode = `CAB-${body.room_number}${body.bed_number}`
      await supabase
        .from("medicine_cabinets")
        .update({
          cabinet_code: newCabinetCode,
          room_number: body.room_number,
          bed_number: body.bed_number,
        })
        .eq("patient_id", params.id)

      // Cập nhật hệ thống nước nếu thay đổi phòng/giường
      await supabase
        .from("water_systems")
        .update({
          room_number: body.room_number,
          bed_number: body.bed_number,
        })
        .eq("patient_id", params.id)
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Error updating patient:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * DELETE /api/patients/:id
 * Deletes patient and related medicine cabinets
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    // Thay vì xóa tủ thuốc, chỉ update patient_id = null
    const { error: cabinetError } = await supabase.from("medicine_cabinets").update({ patient_id: null }).eq("patient_id", params.id)

    if (cabinetError) {
      console.error("Error deleting medicine cabinets:", cabinetError)
      // Tiếp tục xóa bệnh nhân ngay cả khi xóa tủ thuốc thất bại
    }

    // Xóa lịch sử sức khỏe
    const { error: healthError } = await supabase.from("health_monitoring").delete().eq("patient_id", params.id)

    if (healthError) {
      console.error("Error deleting health monitoring:", healthError)
      // Tiếp tục xóa bệnh nhân
    }

    // Xóa lịch uống thuốc
    const { error: scheduleError } = await supabase.from("medication_schedules").delete().eq("patient_id", params.id)

    if (scheduleError) {
      console.error("Error deleting medication schedules:", scheduleError)
      // Tiếp tục xóa bệnh nhân
    }

    // Xóa lịch phát nước
    const { error: waterScheduleError } = await supabase.from("water_schedules").delete().eq("patient_id", params.id)

    if (waterScheduleError) {
      console.error("Error deleting water schedules:", waterScheduleError)
      // Tiếp tục xóa bệnh nhân
    }

    // Xóa log phát nước
    const { error: waterLogError } = await supabase
      .from("water_dispenser_logs")
      .delete()
      .in("water_system_id", 
        (await supabase
          .from("water_systems")
          .select("id")
          .eq("patient_id", params.id)).data?.map(ws => ws.id) || []
      )

    if (waterLogError) {
      console.error("Error deleting water dispenser logs:", waterLogError)
      // Tiếp tục xóa bệnh nhân
    }

    // Xóa hệ thống nước
    const { error: waterSystemError } = await supabase.from("water_systems").delete().eq("patient_id", params.id)

    if (waterSystemError) {
      console.error("Error deleting water systems:", waterSystemError)
      // Tiếp tục xóa bệnh nhân
    }

    // Cuối cùng xóa bệnh nhân
    const { error: patientError } = await supabase.from("patients").delete().eq("id", params.id)

    if (patientError) throw patientError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting patient:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
