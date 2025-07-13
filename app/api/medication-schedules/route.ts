import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patientId")

  try {
    let query = supabase
      .from("medication_schedules")
      .select(`
        *,
        patients (name, room_number),
        medications (name, dosage),
        medicine_cabinets (cabinet_code)
      `)
      .order("time_of_day")

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    const { data: schedules, error } = await query

    if (error) throw error

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching medication schedules:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { data: schedule, error } = await supabase
      .from("medication_schedules")
      .insert([body])
      .select(`
        *,
        patients (name, room_number),
        medications (name, dosage),
        medicine_cabinets (cabinet_code)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Error creating medication schedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
