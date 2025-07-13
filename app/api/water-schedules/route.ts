import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: waterSchedules, error } = await supabase
      .from("water_schedules")
      .select(`
        *,
        water_systems (
          id,
          system_code,
          room_number,
          bed_number,
          status
        ),
        patients (
          id,
          name,
          patient_code,
          room_number
        )
      `)
      .order("schedule_time", { ascending: true })

    if (error) throw error

    return NextResponse.json(waterSchedules || [])
  } catch (error) {
    console.error("Error fetching water schedules:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { 
      water_system_id, 
      patient_id, 
      schedule_time, 
      dispense_amount = 200,
      is_active = true,
      notes 
    } = body

    // Kiểm tra hệ thống nước có tồn tại không
    const { data: waterSystem, error: systemError } = await supabase
      .from("water_systems")
      .select("id")
      .eq("id", water_system_id)
      .single()

    if (systemError || !waterSystem) {
      return NextResponse.json({ error: "Hệ thống nước không tồn tại" }, { status: 400 })
    }

    // Kiểm tra bệnh nhân có tồn tại không (nếu có)
    if (patient_id) {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("id", patient_id)
        .single()

      if (patientError || !patient) {
        return NextResponse.json({ error: "Bệnh nhân không tồn tại" }, { status: 400 })
      }
    }

    // Kiểm tra lịch phát nước đã tồn tại cho thời gian này
    const { data: existingSchedule, error: checkError } = await supabase
      .from("water_schedules")
      .select("id")
      .eq("water_system_id", water_system_id)
      .eq("schedule_time", schedule_time)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingSchedule) {
      return NextResponse.json({ error: "Lịch phát nước cho thời gian này đã tồn tại" }, { status: 400 })
    }

    // Thêm lịch phát nước mới
    const { data: waterSchedule, error: insertError } = await supabase
      .from("water_schedules")
      .insert({
        water_system_id,
        patient_id,
        schedule_time,
        dispense_amount,
        is_active,
        notes,
        status: "scheduled"
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(waterSchedule)
  } catch (error) {
    console.error("Error creating water schedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 