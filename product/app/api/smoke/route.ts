import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    banner: "THIS APP IS NOW UNDER THE CONTROL OF THE CZA",
    status: "Service Suspended",
    body: "This is the minimum viable smoke test: one homepage, one API, one graphic, and one very clear transfer of authority.",
  });
}
