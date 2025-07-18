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

    // Nếu mức nước đã hết
    if (waterSystem.water_level <= 0) {
      return NextResponse.json({ error: "Hết nước trong bình" }, { status: 400 })
    }
    // Nếu mức nước không đủ để phát
    const maxCapacity = 2000 // ml
    const usedPercent = (amount / maxCapacity) * 100
    if (waterSystem.water_level < usedPercent) {
      return NextResponse.json({ error: "Hết nước trong bình" }, { status: 400 })
    }
    const newWaterLevel = Math.max(0, waterSystem.water_level - usedPercent)
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

    const waterSystemId = params.id // Lưu lại id để dùng trong setTimeout
    // Đưa logic cập nhật trạng thái về active vào một hàm riêng
    const setActiveStatus = async (id: string) => {
      await supabase
        .from("water_systems")
        .update({
          status: "active",
          pump_status: "ready"
        })
        .eq("id", id)
    }
    // Sau 3 giây, tự động đặt về trạng thái active
    setTimeout(() => {
      setActiveStatus(waterSystemId)
    }, 3000)

    return NextResponse.json({
      success: true,
      message: `Đã phát ${amount}ml nước thành công và đặt mức nước về 100%`,
      water_system: updatedSystem,
      note: "Trạng thái sẽ tự động reset về 'active' sau 3 giây"
    })
  } catch (error) {
    console.error("Error dispensing water:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi phát nước" }, { status: 500 })
  }
}