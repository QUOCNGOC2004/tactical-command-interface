import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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
        patients(id, name, patient_code)
      `)
      .eq("id", params.id)
      .single()

    if (cabinetError) throw cabinetError

    // ------------------------------------------------------------------
    // Thuốc trong tủ – biến lỗi "relation does not exist" thành mảng rỗng
    // ------------------------------------------------------------------
    let cabinetMeds: { id: string; medication_id: string; quantity: number }[] = []

    try {
      const { data, error } = await supabase
        .from("cabinet_medications")
        .select("id, medication_id, quantity")
        .eq("cabinet_id", params.id)

      if (error) throw error
      cabinetMeds = data ?? []
    } catch (err: any) {
      // Nếu bảng chưa được tạo -> trả về mảng rỗng để UI vẫn chạy
      if (
        typeof err?.message === "string" &&
        err.message.includes("relation") &&
        err.message.includes("cabinet_medications")
      ) {
        console.warn("⚠️  Table cabinet_medications chưa tồn tại – hãy chạy scripts/create-cabinet-medications-v2.sql")
        cabinetMeds = []
      } else {
        throw err
      }
    }

    const medications = []
    for (const cabMed of cabinetMeds) {
      const { data: medDetail } = await supabase
        .from("medications")
        .select("id, name, dosage, unit")
        .eq("id", cabMed.medication_id)
        .single()

      if (medDetail) {
        medications.push({
          id: cabMed.id,
          quantity: cabMed.quantity,
          medications: medDetail,
        })
      }
    }

    // Lấy lịch uống thuốc hôm nay
    const today = new Date().toISOString().split("T")[0]
    const { data: todaySchedules, error: schedulesError } = await supabase
      .from("medication_schedules")
      .select(`
        id,
        time_of_day,
        status,
        dosage_amount,
        medications!inner(name, dosage)
      `)
      .eq("patient_id", cabinet.patients?.id)
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
      medications,
      todaySchedules: transformedSchedules,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching cabinet detail:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
