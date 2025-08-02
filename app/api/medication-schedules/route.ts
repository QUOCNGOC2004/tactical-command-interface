import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patientId")

  try {
    let query = supabase
      .from("medication_schedules")
      .select(`
        *,
        patients (name, room_number),
        medications (name, dosage),
        medicine_cabinets (cabinet_code),
        compartments (compartment_type)
      `)
      .order("time_of_day")

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    const { data: schedules, error } = await query

    if (error) throw error

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching medication schedules:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json();
    const { cabinet_id, compartment, medication_id, ...rest } = body;
    // Map compartment string sang compartment_id
    let compartment_id = null;
    if (cabinet_id && compartment) {
      const { data: comp, error: compError } = await supabase
        .from("compartments")
        .select("id")
        .eq("cabinet_id", cabinet_id)
        .eq("compartment_type", compartment)
        .single();
      if (compError || !comp) {
        return NextResponse.json({ error: "Không tìm thấy ngăn thuốc phù hợp!" }, { status: 400 });
      }
      compartment_id = comp.id;
    }
    // Kiểm tra bộ 3 có tồn tại trong cabinet_medications
    if (cabinet_id && compartment_id && medication_id) {
      const { data: cabMed, error: cabMedError } = await supabase
        .from("cabinet_medications")
        .select("id")
        .eq("cabinet_id", cabinet_id)
        .eq("compartment_id", compartment_id)
        .eq("medication_id", medication_id)
        .single();
      if (cabMedError || !cabMed) {
        return NextResponse.json({ error: "Thuốc không tồn tại trong ngăn tủ này!" }, { status: 400 });
      }
    }
    const insertData = {
      ...rest,
      cabinet_id,
      compartment_id,
      medication_id,
    };
    const { data: schedule, error } = await supabase
      .from("medication_schedules")
      .insert([insertData])
      .select(`
        *,
        patients (name, room_number),
        medications (name, dosage),
        medicine_cabinets (cabinet_code)
      `)
      .single();
    if (error) throw error;
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error creating medication schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
