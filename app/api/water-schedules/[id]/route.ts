import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

/**
 * GET /api/water-schedules/:id
 * Returns the water schedule details
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: waterSchedule, error } = await supabase
      .from("water_schedules")
      .select(`
        *,
        water_systems (
          id,
          system_code,
          room_number,
          bed_number,
          status,
          water_level
        ),
        patients (
          id,
          name,
          patient_code,
          room_number
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !waterSchedule) {
      throw error ?? new Error("Water schedule not found")
    }

    return NextResponse.json(waterSchedule)
  } catch (err) {
    console.error("Error fetching water schedule by ID:", err)
    return NextResponse.json({ error: "Water schedule not found" }, { status: 404 })
  }
}

/**
 * PUT /api/water-schedules/:id
 * Updates water schedule information
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Lấy thông tin lịch phát nước hiện tại
    const { data: currentSchedule } = await supabase
      .from("water_schedules")
      .select("water_system_id, schedule_time")
      .eq("id", params.id)
      .single()

    // Kiểm tra nếu thay đổi thời gian, thời gian mới có trùng không
    if (
      currentSchedule &&
      body.schedule_time &&
      body.schedule_time !== currentSchedule.schedule_time
    ) {
      const { data: existingSchedule } = await supabase
        .from("water_schedules")
        .select("id")
        .eq("water_system_id", currentSchedule.water_system_id)
        .eq("schedule_time", body.schedule_time)
        .neq("id", params.id)
        .single()

      if (existingSchedule) {
        return NextResponse.json(
          { error: "Lịch phát nước cho thời gian này đã tồn tại" },
          { status: 400 },
        )
      }
    }

    // Cập nhật lịch phát nước
    const { data: waterSchedule, error: updateError } = await supabase
      .from("water_schedules")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(waterSchedule)
  } catch (error) {
    console.error("Error updating water schedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * DELETE /api/water-schedules/:id
 * Deletes water schedule
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { error: deleteError } = await supabase
      .from("water_schedules")
      .delete()
      .eq("id", params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting water schedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 