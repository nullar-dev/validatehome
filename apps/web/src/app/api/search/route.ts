import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";
const ALLOWED_PARAMS = new Set(["q", "country", "status", "category", "page", "limit"]);

function validateSearchParams(searchParams: URLSearchParams): string | null {
  const entries = Array.from(searchParams.entries());

  if (searchParams.toString().length > 2048) {
    return "Query string too long";
  }

  for (const [key, value] of entries) {
    if (!ALLOWED_PARAMS.has(key)) {
      return `Unsupported query parameter: ${key}`;
    }
    if (value.length > 200) {
      return `Query parameter too long: ${key}`;
    }
  }

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return "Invalid page parameter";
  }
  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return "Invalid limit parameter";
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validationError = validateSearchParams(searchParams);
  if (validationError) {
    return NextResponse.json(
      { success: false, data: null, meta: { error: validationError } },
      { status: 400 },
    );
  }

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
