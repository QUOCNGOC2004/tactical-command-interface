import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: waterSystems, error } = await supabase
      .from("water_systems")
      .select(`
        *,
        medicine_cabinets (
          cabinet_code,
          patients (
            name,
            room_number,
            bed_number
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Sửa trạng thái nếu đang dispensing quá lâu
    const updatedSystems = waterSystems?.map(system => {
      if (system.status === "dispensing") {
        // Kiểm tra nếu last_dispense cách đây hơn 5 phút thì đặt về active
        if (system.last_dispense) {
          const lastDispenseTime = new Date(system.last_dispense)
          const now = new Date()
          const diffMinutes = (now.getTime() - lastDispenseTime.getTime()) / (1000 * 60)
          
          if (diffMinutes > 5) {
            return {
              ...system,
              status: "active",
              pump_status: "ready"
            }
          }
        }
      }
      return system
    }) || []

    return NextResponse.json(updatedSystems)
  } catch (error) {
    console.error("Error fetching water systems:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json();
    const {
      cabinet_id,
      status = "active",
      water_level = 100,
      pump_status = "ready",
      max_daily_consumption = 2000
    } = body;

    // Kiểm tra tủ đã có hệ thống nước chưa
    const { data: existingSystem, error: checkError } = await supabase
      .from("water_systems")
      .select("id")
      .eq("cabinet_id", cabinet_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingSystem) {
      return NextResponse.json({ error: "Tủ thuốc này đã có hệ thống nước" }, { status: 400 });
    }

    // Tạo mã hệ thống nước
    const system_code = `WS-${Date.now().toString().slice(-6)}`;

    // Thêm hệ thống nước mới
    const { data: waterSystem, error: insertError } = await supabase
      .from("water_systems")
      .insert({
        system_code,
        cabinet_id,
        status,
        water_level,
        pump_status,
        max_daily_consumption,
        daily_consumption: 0
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(waterSystem);
  } catch (error) {
    console.error("Error creating water system:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 