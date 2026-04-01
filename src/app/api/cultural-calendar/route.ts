export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  type: z.enum(["festival", "mythology-event", "devotional"]),
  universes: z.array(z.string()).default([]),
  channels: z.array(z.string()).default([]),
  description: z.string().optional(),
});

const DEFAULT_EVENTS = [
  { name: "Makar Sankranti", date: "2026-01-14", type: "festival" as const, universes: ["A"], description: "Harvest festival marking sun's transition" },
  { name: "Basant Panchami", date: "2026-02-02", type: "festival" as const, universes: ["A"], description: "Festival of spring, Saraswati puja" },
  { name: "Maha Shivratri", date: "2026-02-26", type: "devotional" as const, universes: ["A"], description: "Great night of Shiva" },
  { name: "Holi", date: "2026-03-22", type: "festival" as const, universes: ["A", "B", "C"], description: "Festival of colors" },
  { name: "Ram Navami", date: "2026-04-07", type: "mythology-event" as const, universes: ["A"], description: "Birthday of Lord Ram" },
  { name: "Hanuman Jayanti", date: "2026-04-21", type: "mythology-event" as const, universes: ["A"], description: "Birthday of Lord Hanuman" },
  { name: "Eid ul-Fitr", date: "2026-03-30", type: "festival" as const, universes: [], description: "End of Ramadan" },
  { name: "Janmashtami", date: "2026-08-24", type: "mythology-event" as const, universes: ["A"], description: "Birthday of Lord Krishna" },
  { name: "Ganesh Chaturthi", date: "2026-08-30", type: "festival" as const, universes: ["A", "B"], description: "Festival of Lord Ganesha" },
  { name: "Navratri begins", date: "2026-10-06", type: "festival" as const, universes: ["A"], description: "9 nights of goddess worship" },
  { name: "Dussehra", date: "2026-10-15", type: "mythology-event" as const, universes: ["A"], description: "Victory of Ram over Ravana" },
  { name: "Karva Chauth", date: "2026-10-19", type: "festival" as const, universes: ["A"], description: "Festival of marital fidelity" },
  { name: "Diwali", date: "2026-11-05", type: "festival" as const, universes: ["A", "B", "C"], description: "Festival of lights" },
  { name: "Chhath Puja", date: "2026-11-09", type: "devotional" as const, universes: ["A"], description: "Worship of Sun God" },
  { name: "Christmas", date: "2026-12-25", type: "festival" as const, universes: ["B", "C"], description: "Christmas celebration" },
];

export async function GET(req: NextRequest) {
  try {
    const futureOnly = req.nextUrl.searchParams.get("future") === "true";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

    const count = await prisma.culturalEvent.count();

    // Seed default events if none exist
    if (count === 0) {
      await prisma.culturalEvent.createMany({
        data: DEFAULT_EVENTS.map((e) => ({
          ...e,
          date: new Date(e.date),
          channels: [],
        })),
        skipDuplicates: true,
      });
    }

    const where = futureOnly ? { date: { gte: new Date() } } : {};

    const events = await prisma.culturalEvent.findMany({
      where,
      orderBy: { date: "asc" },
      take: limit,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[cultural-calendar GET]", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = eventSchema.parse(body);

    const event = await prisma.culturalEvent.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[cultural-calendar POST]", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
