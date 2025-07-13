import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const today = new Date().toISOString().split("T")[0]

    const { data: schedules, error } = await supabase
      .from("medication_schedules")
      .select(`
        id,
        time_of_day,
        status,
        dosage_amount,
        created_at,
        patients!inner(name, room_number, bed_number),
        medications!inner(name, dosage)
      `)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)
      .order("time_of_day", { ascending: true })

    if (error) throw error

    // Transform data to match expected format
    const transformedSchedules =
      schedules?.map((schedule) => ({
        id: schedule.id,
        patient_name: schedule.patients.name,
        room_number: schedule.patients.room_number,
        bed_number: schedule.patients.bed_number,
        medication_name: schedule.medications.name,
        scheduled_time: `${today}T${schedule.time_of_day}:00`,
        status: schedule.status,
        dosage_amount: schedule.dosage_amount,
      })) || []

    return NextResponse.json(transformedSchedules)
  } catch (error) {
    console.error("Error fetching today's schedules:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
