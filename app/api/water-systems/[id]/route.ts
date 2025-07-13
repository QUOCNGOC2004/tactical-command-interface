import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

/**
 * GET /api/water-systems/:id
 * Returns the water system with related data
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: waterSystem, error } = await supabase
      .from("water_systems")
      .select(`
        *,
        patients (
          id,
          name,
          patient_code,
          room_number,
          bed_number
        ),
        water_schedules (
          id,
          schedule_time,
          dispense_amount,
          status,
          last_dispensed,
          is_active
        ),
        water_dispenser_logs (
          id,
          water_level,
          dispensed_amount,
          trigger_type,
          dispensed_at
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !waterSystem) {
      throw error ?? new Error("Water system not found")
    }

    return NextResponse.json(waterSystem)
  } catch (err) {
    console.error("Error fetching water system by ID:", err)
    return NextResponse.json({ error: "Water system not found" }, { status: 404 })
  }
}

/**
 * PUT /api/water-systems/:id
 * Updates water system information
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Lấy thông tin hệ thống nước hiện tại
    const { data: currentSystem } = await supabase
      .from("water_systems")
      .select("room_number, bed_number")
      .eq("id", params.id)
      .single()

    // Kiểm tra nếu thay đổi phòng/giường, phòng mới có hệ thống nước chưa
    if (
      currentSystem &&
      (body.room_number !== currentSystem.room_number || body.bed_number !== currentSystem.bed_number)
    ) {
      const { data: existingSystem } = await supabase
        .from("water_systems")
        .select("id")
        .eq("room_number", body.room_number)
        .eq("bed_number", body.bed_number)
        .neq("id", params.id)
        .single()

      if (existingSystem) {
        return NextResponse.json(
          { error: `Hệ thống nước cho phòng ${body.room_number} giường ${body.bed_number} đã tồn tại` },
          { status: 400 },
        )
      }
    }

    // Cập nhật thông tin hệ thống nước
    const { data: waterSystem, error: updateError } = await supabase
      .from("water_systems")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(waterSystem)
  } catch (error) {
    console.error("Error updating water system:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * DELETE /api/water-systems/:id
 * Deletes water system and related data
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    // Xóa lịch phát nước trước (foreign key constraint)
    const { error: scheduleError } = await supabase
      .from("water_schedules")
      .delete()
      .eq("water_system_id", params.id)

    if (scheduleError) {
      console.error("Error deleting water schedules:", scheduleError)
    }

    // Xóa log phát nước
    const { error: logError } = await supabase
      .from("water_dispenser_logs")
      .delete()
      .eq("water_system_id", params.id)

    if (logError) {
      console.error("Error deleting water dispenser logs:", logError)
    }

    // Cuối cùng xóa hệ thống nước
    const { error: systemError } = await supabase
      .from("water_systems")
      .delete()
      .eq("id", params.id)

    if (systemError) throw systemError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting water system:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 