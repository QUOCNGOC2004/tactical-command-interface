import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"


export async function GET(request: Request, context: any) {
  const { params } = await context;
  const supabase = createServerClient()
  try {
    // Lấy thông tin tủ thuốc
    const { data: cabinet, error: cabinetError } = await supabase
      .from("medicine_cabinets")
      .select(`
        id,
        cabinet_code,
        room_number,
        bed_number,
        status,
        patients(id, name, patient_code, room_number, bed_number)
      `)
      .eq("id", params.id)
      .single()
    if (cabinetError) throw cabinetError
    // patients có thể là mảng nếu select dạng relation, lấy phần tử đầu tiên hoặc null
    const patientObj = Array.isArray(cabinet.patients) ? cabinet.patients[0] : cabinet.patients

    // Lấy danh sách ngăn thuốc của tủ
    const { data: compartments, error: compError } = await supabase
      .from("compartments")
      .select("id, compartment_type, rfid_code")
      .eq("cabinet_id", params.id)
      .order("compartment_type", { ascending: true })
    if (compError) throw compError

    // Lấy thuốc trong từng ngăn
    const compartmentsWithMeds = []
    for (const comp of compartments || []) {
      // Lấy danh sách thuốc trong ngăn này
      const { data: cabMeds } = await supabase
        .from("cabinet_medications")
        .select("id, medication_id, quantity, expiry_date, medications(id, name, dosage, unit)")
        .eq("compartment_id", comp.id)
      const meds = (cabMeds || []).map((cabMed) => ({
        id: cabMed.id,
        quantity: cabMed.quantity,
        expiry_date: cabMed.expiry_date,
        medications: cabMed.medications,
      }))
      compartmentsWithMeds.push({
        id: comp.id,
        compartment_type: comp.compartment_type,
        rfid_code: comp.rfid_code,
        medications: meds,
      })
    }

    // Lấy lịch uống thuốc hôm nay
    const today = new Date().toISOString().split("T")[0]
    const { data: todaySchedules } = await supabase
      .from("medication_schedules")
      .select(`
        id,
        time_of_day,
        status,
        dosage_amount,
        medications!inner(name, dosage)
      `)
      .eq("patient_id", patientObj?.id)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)
      .order("time_of_day", { ascending: true })

    const transformedSchedules =
      todaySchedules?.map((schedule) => ({
        id: schedule.id,
        time: `${today}T${schedule.time_of_day}:00`,
        status: schedule.status,
        dosage_amount: schedule.dosage_amount,
        medications: schedule.medications,
      })) || []

    const result = {
      ...cabinet,
      room_number: patientObj ? patientObj.room_number : cabinet.room_number,
      bed_number: patientObj ? patientObj.bed_number : cabinet.bed_number,
      patient: patientObj
        ? {
            id: patientObj.id,
            name: patientObj.name,
            patient_code: patientObj.patient_code,
            room_number: patientObj.room_number,
            bed_number: patientObj.bed_number,
          }
        : null,
      compartments: compartmentsWithMeds,
      todaySchedules: transformedSchedules,
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching cabinet detail:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: any) {
  const { params } = await context;
  const supabase = createServerClient()
  try {
    const body = await request.json()
    const { patient_id } = body
    // Gán hoặc bỏ gán bệnh nhân cho tủ thuốc
    const updateData: any = { patient_id }
    const { error } = await supabase
      .from("medicine_cabinets")
      .update(updateData)
      .eq("id", params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating cabinet patient:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
