import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/search/facets`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null, meta: {} }, { status: 500 });
  }
}
