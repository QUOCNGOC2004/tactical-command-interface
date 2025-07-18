import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  try {
    const { data: waterSystem, error } = await supabase
      .from("water_systems")
      .select("*")
      .eq("id", params.id)
      .single()
    if (error || !waterSystem) {
      return NextResponse.json({ error: "Hệ thống nước không tồn tại" }, { status: 404 })
    }
    const { error: updateError } = await supabase
      .from("water_systems")
      .update({ water_level: 100 })
      .eq("id", params.id)
    if (updateError) throw updateError
    return NextResponse.json({ success: true, message: "Đã bơm nước, mức nước về 100%" })
  } catch (err) {
    return NextResponse.json({ error: "Lỗi khi bơm nước" }, { status: 500 })
  }
} 