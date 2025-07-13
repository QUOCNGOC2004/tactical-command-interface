import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { data: medication, error } = await supabase
      .from("medications")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(medication)
  } catch (error) {
    console.error("Error updating medication:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("medications").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting medication:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
