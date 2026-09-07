import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  await clearSession();
  const host = req.headers.get("host") || "";
  return NextResponse.redirect(`http://${host}/login`);
}
