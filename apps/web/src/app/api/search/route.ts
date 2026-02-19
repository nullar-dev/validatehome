import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  try {
    const response = await fetch(`${API_URL}/search?${query}`);
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, data: null, meta: {} }, { status: 500 });
  }
}
