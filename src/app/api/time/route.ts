import { NextResponse } from "next/server";
import { z } from "zod";

const internetTimeSchema = z.object({
  datetime: z.string(),
  timezone: z.string(),
  unixtime: z.number(),
  utc_offset: z.string(),
});

function localFallbackResponse() {
  const now = Date.now();

  return NextResponse.json({
    epochMs: now,
    timezone: "Asia/Kolkata",
    utcOffset: "+05:30",
    source: "local-server-fallback",
  });
}

export async function GET() {
  try {
    const response = await fetch("https://worldtimeapi.org/api/timezone/Asia/Kolkata", {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return localFallbackResponse();
    }

    const payload = internetTimeSchema.safeParse(await response.json());

    if (!payload.success) {
      return localFallbackResponse();
    }

    const parsedDatetime = Date.parse(payload.data.datetime);
    const epochMs = Number.isNaN(parsedDatetime) ? payload.data.unixtime * 1000 : parsedDatetime;

    return NextResponse.json({
      epochMs,
      timezone: payload.data.timezone,
      utcOffset: payload.data.utc_offset,
      source: "worldtimeapi.org",
    });
  } catch {
    return localFallbackResponse();
  }
}
