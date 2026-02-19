import { calculateNetCost, type NetCostCalculatorInput } from "@validatehome/calculator";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NetCostCalculatorInput;

    if (!body.stickerPrice || body.stickerPrice <= 0) {
      return NextResponse.json({ error: "Sticker price must be greater than 0" }, { status: 400 });
    }

    if (!body.country || !["US", "UK", "AU", "CA"].includes(body.country)) {
      return NextResponse.json({ error: "Country must be US, UK, AU, or CA" }, { status: 400 });
    }

    const result = calculateNetCost(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
