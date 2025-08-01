import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    // Lấy tổng số hệ thống nước có bệnh nhân
    const { count: totalSystems } = await supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })
      .not("patient_id", "is", null)

    // Lấy số hệ thống đang hoạt động có bệnh nhân
    const { count: activeSystems } = await supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .not("patient_id", "is", null)

    // Lấy số hệ thống đang phát nước có bệnh nhân
    const { count: dispensingSystems } = await supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })
      .eq("status", "dispensing")
      .not("patient_id", "is", null)

    // Lấy số hệ thống cảnh báo nước thấp có bệnh nhân
    const { count: lowWaterSystems } = await supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })
      .eq("status", "low_water")
      .not("patient_id", "is", null)

    // Lấy số hệ thống bảo trì có bệnh nhân
    const { count: maintenanceSystems } = await supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })
      .eq("status", "maintenance")
      .not("patient_id", "is", null)

    // Tính tổng tiêu thụ nước hôm nay chỉ cho hệ thống có bệnh nhân
    const { data: todayConsumption } = await supabase
      .from("water_systems")
      .select("daily_consumption, patient_id")
      .not("patient_id", "is", null)

    const totalConsumption = todayConsumption?.reduce((sum, system) => sum + (system.daily_consumption || 0), 0) || 0

    // Lấy hệ thống có mức nước thấp nhất (có bệnh nhân)
    const { data: lowestWaterSystem } = await supabase
      .from("water_systems")
      .select("system_code, room_number, water_level, patient_id")
      .not("patient_id", "is", null)
      .order("water_level", { ascending: true })
      .limit(1)
      .single()

    // Lấy hệ thống tiêu thụ nhiều nhất hôm nay (có bệnh nhân)
    const { data: highestConsumptionSystem } = await supabase
      .from("water_systems")
      .select("system_code, room_number, daily_consumption, patient_id")
      .not("patient_id", "is", null)
      .order("daily_consumption", { ascending: false })
      .limit(1)
      .single()

    // Lấy lịch phát nước sắp tới
    const now = new Date()
    const currentTime = now.toTimeString().split(' ')[0]
    
    const { data: upcomingSchedules } = await supabase
      .from("water_schedules")
      .select(`
        schedule_time,
        dispense_amount,
        water_systems (
          system_code,
          room_number
        )
      `)
      .gte("schedule_time", currentTime)
      .eq("status", "scheduled")
      .order("schedule_time", { ascending: true })
      .limit(5)

    const stats = {
      totalSystems: totalSystems || 0,
      activeSystems: activeSystems || 0,
      dispensingSystems: dispensingSystems || 0,
      lowWaterSystems: lowWaterSystems || 0,
      maintenanceSystems: maintenanceSystems || 0,
      totalConsumption: totalConsumption,
      lowestWaterSystem: lowestWaterSystem,
      highestConsumptionSystem: highestConsumptionSystem,
      upcomingSchedules: upcomingSchedules || []
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching water system status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 