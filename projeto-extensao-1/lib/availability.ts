import Appointment from "@/lib/models/Appointment";

const START = process.env.WORKING_HOURS_START ?? "09:00";
const END = process.env.WORKING_HOURS_END ?? "18:00";
const INTERVAL = parseInt(process.env.SLOT_INTERVAL_MINUTES ?? "30", 10);

/** Converte "HH:MM" em total de minutos desde meia-noite */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Converte minutos desde meia-noite em "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Calcula o horário de término dado um início e duração em minutos */
export function calcEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

/**
 * Verifica se dois intervalos de tempo se sobrepõem.
 * Usa comparação de strings "HH:MM" (funciona pois strings estão em ordem lexicográfica).
 */
function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Retorna os horários disponíveis para um barbeiro em uma data,
 * considerando a duração do serviço e os agendamentos existentes.
 */
export async function getAvailableSlots(
  barberId: string,
  date: string,
  durationMinutes: number
): Promise<string[]> {
  // Busca agendamentos ativos do barbeiro na data
  const existingAppointments = await Appointment.find({
    barberId,
    date,
    status: { $in: ["pending", "confirmed"] },
  }).select("timeSlot endTime");

  const startMinutes = timeToMinutes(START);
  const endMinutes = timeToMinutes(END);
  const availableSlots: string[] = [];

  for (
    let slotStart = startMinutes;
    slotStart + durationMinutes <= endMinutes;
    slotStart += INTERVAL
  ) {
    const slotStartStr = minutesToTime(slotStart);
    const slotEndStr = minutesToTime(slotStart + durationMinutes);

    // Verifica se o slot conflita com algum agendamento existente
    const hasConflict = existingAppointments.some((appt) =>
      overlaps(slotStartStr, slotEndStr, appt.timeSlot, appt.endTime)
    );

    if (!hasConflict) {
      availableSlots.push(slotStartStr);
    }
  }

  return availableSlots;
}
