import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function DELETE(request: Request, { params }: { params: { id: string, medicationId: string } }) {
  const supabase = createServerClient();

  try {
    // Lấy compartment_id từ query nếu có
    const url = new URL(request.url)
    const compartment_id = url.searchParams.get("compartment_id")
    let query = supabase
      .from("cabinet_medications")
      .delete()
      .eq("id", params.medicationId)
      .eq("cabinet_id", params.id)
    if (compartment_id) {
      query = query.eq("compartment_id", compartment_id)
    }
    const { error } = await query
    if (error) {
      return NextResponse.json({ error: "Không thể xóa thuốc" }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string, medicationId: string } }) {
  const supabase = createServerClient();
  try {
    const body = await request.json();
    const { quantity, compartment_id } = body;
    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ error: "Số lượng không hợp lệ" }, { status: 400 });
    }
    let query = supabase
      .from("cabinet_medications")
      .update({ quantity })
      .eq("id", params.medicationId)
      .eq("cabinet_id", params.id)
    if (compartment_id) {
      query = query.eq("compartment_id", compartment_id)
    }
    const { error } = await query
    if (error) {
      return NextResponse.json({ error: "Không thể cập nhật số lượng thuốc" }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}