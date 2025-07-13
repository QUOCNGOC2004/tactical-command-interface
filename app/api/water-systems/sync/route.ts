import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

/**
 * POST /api/water-systems/sync
 * Đồng bộ hệ thống nước với bệnh nhân hiện có
 */
export async function POST() {
  const supabase = createServerClient()

  try {
    // Lấy danh sách bệnh nhân
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, room_number, bed_number, status")
      .order("room_number", { ascending: true })

    if (patientsError) throw patientsError

    if (!patients || patients.length === 0) {
      return NextResponse.json({ 
        error: "Không có bệnh nhân nào để đồng bộ" 
      }, { status: 400 })
    }

    // Lấy danh sách hệ thống nước hiện có
    const { data: existingWaterSystems, error: waterSystemsError } = await supabase
      .from("water_systems")
      .select("id, patient_id, room_number, bed_number")

    if (waterSystemsError) throw waterSystemsError

    const existingPatientIds = existingWaterSystems?.map(ws => ws.patient_id) || []
    const createdSystems = []
    const updatedSystems = []

    // Tạo hệ thống nước cho bệnh nhân chưa có
    for (const patient of patients) {
      if (!existingPatientIds.includes(patient.id)) {
        // Tạo hệ thống nước mới
        const { count: totalSystems } = await supabase
          .from("water_systems")
          .select("*", { count: "exact", head: true })

        const systemCode = `WS-${String((totalSystems || 0) + 1).padStart(3, '0')}`
        
        const { data: waterSystem, error: systemError } = await supabase
          .from("water_systems")
          .insert({
            system_code: systemCode,
            room_number: patient.room_number,
            bed_number: patient.bed_number || "A",
            patient_id: patient.id,
            status: "active",
            water_level: 100,
            pump_status: "ready",
            daily_consumption: 0,
            max_daily_consumption: 2000
          })
          .select()
          .single()

        if (!systemError && waterSystem) {
          createdSystems.push(waterSystem)

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
      }
    }

    // Xóa hệ thống nước không có bệnh nhân
    const patientIds = patients.map(p => p.id)
    const { data: orphanedSystems, error: orphanedError } = await supabase
      .from("water_systems")
      .select("id, patient_id")
      .not("patient_id", "in", `(${patientIds.join(",")})`)

    if (!orphanedError && orphanedSystems) {
      for (const orphaned of orphanedSystems) {
        // Xóa lịch phát nước
        await supabase.from("water_schedules").delete().eq("water_system_id", orphaned.id)
        
        // Xóa log phát nước
        await supabase.from("water_dispenser_logs").delete().eq("water_system_id", orphaned.id)
        
        // Xóa hệ thống nước
        await supabase.from("water_systems").delete().eq("id", orphaned.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đồng bộ hoàn tất: Tạo ${createdSystems.length} hệ thống mới, Xóa ${orphanedSystems?.length || 0} hệ thống không hợp lệ`,
      createdSystems,
      deletedSystems: orphanedSystems?.length || 0
    })

  } catch (error) {
    console.error("Error syncing water systems:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 