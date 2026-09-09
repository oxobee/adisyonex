import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  await destroySession();
  const url = new URL("/mlogin", request.url);
  return NextResponse.redirect(url);
}
