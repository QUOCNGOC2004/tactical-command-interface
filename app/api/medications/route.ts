import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: medications, error } = await supabase.from("medications").select("*").order("name")

    if (error) throw error

    return NextResponse.json(medications)
  } catch (error) {
    console.error("Error fetching medications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { data: medication, error } = await supabase.from("medications").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json(medication)
  } catch (error) {
    console.error("Error creating medication:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
