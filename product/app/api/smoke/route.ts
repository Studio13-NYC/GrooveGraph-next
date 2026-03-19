import { NextResponse } from "next/server";

export const dynamic = "force-static";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    {
      banner: "THIS APP IS NOW UNDER THE CONTROL OF THE CZA",
      status: "Service Suspended",
      body: "This is the minimum viable smoke test: one homepage, one API, one graphic, and one very clear transfer of authority.",
    },
    { headers: corsHeaders },
  );
}
