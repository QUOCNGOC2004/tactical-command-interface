import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: doctors, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json(doctors)
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
