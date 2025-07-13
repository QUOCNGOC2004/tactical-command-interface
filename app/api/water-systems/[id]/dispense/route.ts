import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

/**
 * POST /api/water-systems/:id/dispense
 * Manually dispense water from a water system
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { amount = 200, trigger_type = "manual" } = body

    // Lấy thông tin hệ thống nước
    const { data: waterSystem, error: systemError } = await supabase
      .from("water_systems")
      .select("*")
      .eq("id", params.id)
      .single()

    if (systemError || !waterSystem) {
      return NextResponse.json({ error: "Hệ thống nước không tồn tại" }, { status: 404 })
    }

    // Kiểm tra trạng thái hệ thống
    if (waterSystem.status === "maintenance" || waterSystem.status === "error") {
      return NextResponse.json({ error: "Hệ thống nước đang bảo trì hoặc có lỗi" }, { status: 400 })
    }

    // Kiểm tra giới hạn tiêu thụ hàng ngày
    if (waterSystem.daily_consumption + amount > waterSystem.max_daily_consumption) {
      return NextResponse.json({ 
        error: `Vượt quá giới hạn tiêu thụ hàng ngày (${waterSystem.max_daily_consumption}ml)` 
      }, { status: 400 })
    }

    // Tính toán mức nước mới - đặt về 100% khi phát nước
    const newWaterLevel = 100 // Đặt mức nước về 100%
    const newDailyConsumption = waterSystem.daily_consumption + amount

    // Cập nhật hệ thống nước
    const { data: updatedSystem, error: updateError } = await supabase
      .from("water_systems")
      .update({
        water_level: newWaterLevel,
        daily_consumption: newDailyConsumption,
        last_dispense: new Date().toISOString(),
        status: "dispensing", // Tạm thời đặt về dispensing
        pump_status: "active" // Tạm thời đặt về active
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Tạo log phát nước
    const { error: logError } = await supabase
      .from("water_dispenser_logs")
      .insert({
        water_system_id: params.id,
        water_level: waterSystem.water_level, // Mức nước cũ
        dispensed_amount: amount,
        trigger_type: trigger_type,
        dispensed_at: new Date().toISOString()
      })

    if (logError) {
      console.error("Error creating water dispenser log:", logError)
    }

    // Sau 3 giây, tự động đặt về trạng thái active
    setTimeout(async () => {
      await supabase
        .from("water_systems")
        .update({
          status: "active",
          pump_status: "ready"
        })
        .eq("id", params.id)
    }, 3000)

    return NextResponse.json({
      success: true,
      message: `Đã phát ${amount}ml nước thành công và đặt mức nước về 100%`,
      water_system: updatedSystem,
      note: "Trạng thái sẽ tự động reset về 'active' sau 3 giây"
    })
  } catch (error) {
    console.error("Error dispensing water:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}