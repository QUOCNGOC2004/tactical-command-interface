import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: patients, error } = await supabase
      .from("patients")
      .select(
        `
        *,
        medicine_cabinets (
          id,
          cabinet_code,
          status
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
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(patients || [])
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { name, age, room_number, bed_number, condition, admission_date, doctor_name, emergency_contact, status } =
      body

    // Kiểm tra giường có trống không
    const { data: existingPatient, error: checkError } = await supabase
      .from("patients")
      .select("id")
      .eq("room_number", room_number)
      .eq("bed_number", bed_number)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingPatient) {
      return NextResponse.json({ error: "Bed is already occupied" }, { status: 400 })
    }

    // Tạo mã bệnh nhân
    const patient_code = `BN${Date.now().toString().slice(-6)}`

    // Thêm bệnh nhân
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        patient_code,
        name,
        age,
        room_number,
        bed_number,
        condition,
        admission_date,
        doctor_name,
        emergency_contact,
        status,
      })
      .select()
      .single()

    if (patientError) throw patientError

    // Tạo hệ thống nước cho bệnh nhân mới
    const { count: existingWaterSystems } = await supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })

    const waterSystemCode = `WS-${String((existingWaterSystems || 0) + 1).padStart(3, '0')}`
    
    const { data: waterSystem, error: waterSystemError } = await supabase
      .from("water_systems")
      .insert({
        system_code: waterSystemCode,
        room_number,
        bed_number,
        patient_id: patient.id,
        status: "active",
        water_level: 100,
        pump_status: "ready",
        daily_consumption: 0,
        max_daily_consumption: 2000
      })
      .select()
      .single()

    if (waterSystemError) {
      console.error("Error creating water system:", waterSystemError)
      // Không throw error vì bệnh nhân đã được tạo thành công
    } else {
      // Tạo lịch phát nước mặc định
      const scheduleTimes = ["07:00:00", "12:00:00", "18:00:00"]
      for (const time of scheduleTimes) {
        await supabase
          .from("water_schedules")
          .insert({
            water_system_id: waterSystem.id,
            patient_id: patient.id,
            schedule_time: time,
            dispense_amount: 200,
            is_active: true,
            status: "scheduled"
          })
      }
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
