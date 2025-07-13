import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    // Lấy tất cả bệnh nhân hiện tại
    const { data: patients, error } = await supabase.from("patients").select("room_number, bed_number")

    if (error) throw error

    // Tạo danh sách giường đã được sử dụng
    const occupiedBeds = new Set()
    patients?.forEach((patient) => {
      occupiedBeds.add(`${patient.room_number}-${patient.bed_number}`)
    })

    // Danh sách phòng và giường
    const rooms = ["101", "102", "103", "104", "105", "201", "202", "203", "204", "205"]
    const beds = ["A", "B", "C", "D"]

    // Tạo danh sách giường trống cho mỗi phòng
    const availableBeds: Record<string, string[]> = {}

    rooms.forEach((room) => {
      availableBeds[room] = beds.filter((bed) => !occupiedBeds.has(`${room}-${bed}`))
    })

    return NextResponse.json(availableBeds)
  } catch (error) {
    console.error("Error fetching available beds:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
