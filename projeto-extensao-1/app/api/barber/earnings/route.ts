import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth";

type Period = "today" | "week" | "month";

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "today") {
    const today = fmt(now);
    return { startDate: today, endDate: today };
  }

  if (period === "week") {
    const day = now.getDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day; // shift to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { startDate: fmt(monday), endDate: fmt(sunday) };
  }

  // month
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: fmt(firstDay), endDate: fmt(lastDay) };
}

/**
 * GET /api/barber/earnings
 * Query params:
 *   - period: today | week | month  (default: today)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("period") ?? "today";

    if (!["today", "week", "month"].includes(raw)) {
      return NextResponse.json({ error: "Período inválido." }, { status: 400 });
    }

    const period = raw as Period;
    const { startDate, endDate } = getDateRange(period);

    await connectDB();

    const appointments = await Appointment.find({
      barberId: auth.barberId,
      status: "completed",
      date: { $gte: startDate, $lte: endDate },
    }).populate("serviceId", "name price");

    type ServicePopulated = { name: string; price: number };

    const totalEarnings = appointments.reduce((sum, a) => {
      const svc = a.serviceId as unknown as ServicePopulated | null;
      return sum + (svc?.price ?? 0);
    }, 0);

    // Breakdown by service
    const serviceMap = new Map<string, { name: string; count: number; total: number }>();
    for (const a of appointments) {
      const svc = a.serviceId as unknown as ServicePopulated | null;
      if (!svc) continue;
      const entry = serviceMap.get(svc.name) ?? { name: svc.name, count: 0, total: 0 };
      entry.count += 1;
      entry.total += svc.price;
      serviceMap.set(svc.name, entry);
    }

    const byService = Array.from(serviceMap.values()).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      period,
      startDate,
      endDate,
      totalEarnings,
      totalCompleted: appointments.length,
      avgEarnings: appointments.length > 0 ? totalEarnings / appointments.length : 0,
      byService,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/barber/earnings]", error);
    return NextResponse.json({ error: "Erro interno ao calcular ganhos." }, { status: 500 });
  }
}
