import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: cabinets, error } = await supabase
      .from("medicine_cabinets")
      .select(`
        id,
        cabinet_code,
        room_number,
        bed_number,
        status,
        patient_id,
        patients (
          id,
          name,
          patient_code,
          room_number,
          bed_number
        )
      `)
      .order("room_number", { ascending: true })
      .order("bed_number", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    // Transform data to match the interface
    const transformedCabinets = (cabinets || []).map((cabinet) => ({
      id: cabinet.id,
      cabinet_code: cabinet.cabinet_code,
      room_number: cabinet.patients ? cabinet.patients.room_number : cabinet.room_number,
      bed_number: cabinet.patients ? cabinet.patients.bed_number : cabinet.bed_number,
      status: cabinet.status || "locked",
      patient: cabinet.patients
        ? {
            id: cabinet.patients.id,
            name: cabinet.patients.name,
            patient_code: cabinet.patients.patient_code,
            room_number: cabinet.patients.room_number,
            bed_number: cabinet.patients.bed_number,
          }
        : null,
    }))

    return NextResponse.json(transformedCabinets)
  } catch (error) {
    console.error("Error fetching medicine cabinets:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
