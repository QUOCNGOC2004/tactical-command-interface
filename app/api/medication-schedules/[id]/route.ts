import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { data: schedule, error } = await supabase
      .from("medication_schedules")
      .update(body)
      .eq("id", params.id)
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
    console.error("Error updating medication schedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("medication_schedules").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting medication schedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
