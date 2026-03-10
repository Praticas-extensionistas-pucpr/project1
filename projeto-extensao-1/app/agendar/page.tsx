"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Barber {
  _id: string;
  name: string;
  phone: string;
  bio?: string;
  avatarUrl?: string;
}

interface Service {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

interface BookingResult {
  _id: string;
  clientName: string;
  date: string;
  timeSlot: string;
  endTime: string;
  barberId: { name: string };
  serviceId: { name: string; price: number };
  status: string;
}

interface ClientForm {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientNotes: string;
}

// ── Step progress labels ───────────────────────────────────────────────────────

const STEPS = [
  "Barbeiro",
  "Serviço",
  "Data",
  "Horário",
  "Seus dados",
];

// ── Small reusable components ─────────────────────────────────────────────────

function BarberIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 2v2H5v2H3V2h4zm14 0v4h-2V4h-2V2h4zM3 20v-4h2v2h2v2H3zm16 0h-2v-2h2v-2h2v4h-2zM7 6v2H5v2H3V6h4zm4 0h2v2h2v2h-2v2h-2V6zm4 0h2v4h-2V6zM7 14v2H5v2H3v-4h4zm10 0h2v4h-4v-2h2v-2zm-6 0h2v4h-2v-4zm-2-4h2v2H9v-2z" />
    </svg>
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white text-base font-bold shrink-0">
      {initials}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
    </div>
  );
}

function StepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-1">
        Passo {step} de {total}
      </p>
      <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
      {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Booking Wizard ─────────────────────────────────────────────────────────────

function BookingWizardInner() {
  const searchParams = useSearchParams();
  const preselectedBarberId = searchParams.get("barbeiro");

  const [step, setStep] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  // Data
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  // Selections
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [clientForm, setClientForm] = useState<ClientForm>({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientNotes: "",
  });

  // Loading / error states
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formError, setFormError] = useState("");

  // Success
  const [booking, setBooking] = useState<BookingResult | null>(null);

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  // Scroll to top on step change
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  // Fetch barbers on mount
  useEffect(() => {
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((d) => {
        const list: Barber[] = d.data ?? [];
        setBarbers(list);
        // Auto-select if preselected ID provided
        if (preselectedBarberId) {
          const found = list.find((b) => b._id === preselectedBarberId);
          if (found) {
            setSelectedBarber(found);
            setStep(2);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBarbers(false));
  }, [preselectedBarberId]);

  // Fetch services when reaching step 2
  useEffect(() => {
    if (step === 2 && services.length === 0) {
      setLoadingServices(true);
      fetch("/api/services")
        .then((r) => r.json())
        .then((d) => setServices(d.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingServices(false));
    }
  }, [step, services.length]);

  // Fetch slots when date is selected (step 4)
  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");
    const params = new URLSearchParams({
      barberId: selectedBarber._id,
      serviceId: selectedService._id,
      date: selectedDate,
    });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.data?.availableSlots ?? []))
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [selectedBarber, selectedService, selectedDate]);

  function goBack() {
    setStep((s) => s - 1);
  }

  function setField(field: keyof ClientForm, value: string) {
    setClientForm((f) => ({ ...f, [field]: value }));
    setFormError("");
  }

  async function handleSubmit() {
    const { clientName, clientPhone, clientEmail, clientNotes } = clientForm;
    if (!clientName.trim()) {
      setFormError("Informe seu nome.");
      return;
    }
    if (!clientPhone.trim()) {
      setFormError("Informe seu telefone.");
      return;
    }
    setFormError("");
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
          clientNotes: clientNotes.trim() || undefined,
          barberId: selectedBarber!._id,
          serviceId: selectedService!._id,
          date: selectedDate,
          timeSlot: selectedSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar agendamento.");
      setBooking(data.data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao criar agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  // ── Success screen ───────────────────────────────────────────────────────────

  if (booking) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Agendamento criado!</h1>
            <p className="text-zinc-500 text-sm mb-8">
              Seu agendamento foi registrado com sucesso. Aguarde a confirmação do barbeiro.
            </p>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 text-left space-y-4 mb-8">
              <Row label="Cliente" value={booking.clientName} />
              <Row label="Barbeiro" value={booking.barberId?.name} />
              <Row label="Serviço" value={`${booking.serviceId?.name} — R$ ${booking.serviceId?.price?.toFixed(2).replace(".", ",")}`} />
              <Row label="Data" value={formatDate(booking.date)} />
              <Row label="Horário" value={`${booking.timeSlot} – ${booking.endTime}`} />
              <Row
                label="Status"
                value=""
                custom={
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Aguardando confirmação
                  </span>
                }
              />
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-amber-400 text-zinc-900 font-semibold px-6 py-3 rounded-full hover:bg-amber-300 transition-colors"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col" ref={topRef}>
      <NavBar />

      {/* Progress bar */}
      <div className="bg-white border-b border-zinc-100 px-4 sm:px-6 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-1.5">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n === step;
              return (
                <div key={n} className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-colors ${
                      done
                        ? "bg-amber-400 text-zinc-900"
                        : active
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-200 text-zinc-400"
                    }`}
                  >
                    {done ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      n
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium truncate hidden sm:block ${
                      active ? "text-zinc-900" : done ? "text-zinc-500" : "text-zinc-300"
                    }`}
                  >
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-1 ${done ? "bg-amber-400" : "bg-zinc-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-xl mx-auto">

          {/* ── Step 1: Barbeiro ── */}
          {step === 1 && (
            <div>
              <StepHeader
                step={1}
                total={5}
                title="Escolha o barbeiro"
                subtitle="Selecione com quem você quer ser atendido."
              />
              {loadingBarbers ? (
                <Spinner />
              ) : barbers.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-10">Nenhum barbeiro disponível.</p>
              ) : (
                <div className="space-y-3">
                  {barbers.map((barber) => (
                    <button
                      key={barber._id}
                      onClick={() => {
                        setSelectedBarber(barber);
                        setSelectedService(null);
                        setSelectedDate("");
                        setSelectedSlot("");
                        setStep(2);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        selectedBarber?._id === barber._id
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      {barber.avatarUrl ? (
                        <img src={barber.avatarUrl} alt={barber.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <AvatarPlaceholder name={barber.name} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900">{barber.name}</p>
                        {barber.bio && (
                          <p className="text-zinc-500 text-sm mt-0.5 line-clamp-1">{barber.bio}</p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-zinc-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Serviço ── */}
          {step === 2 && (
            <div>
              <StepHeader
                step={2}
                total={5}
                title="Escolha o serviço"
                subtitle="Selecione o serviço que deseja realizar."
              />
              {loadingServices ? (
                <Spinner />
              ) : services.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-10">Nenhum serviço disponível.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      onClick={() => {
                        setSelectedService(service);
                        setSelectedDate("");
                        setSelectedSlot("");
                        setStep(3);
                      }}
                      className={`w-full flex items-start justify-between gap-4 p-4 rounded-xl border text-left transition-all ${
                        selectedService?._id === service._id
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900">{service.name}</p>
                        {service.description && (
                          <p className="text-zinc-500 text-sm mt-0.5">{service.description}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 text-zinc-400 text-xs">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {service.durationMinutes} min
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-amber-600">
                          R$ {service.price.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <BackButton onClick={goBack} />
            </div>
          )}

          {/* ── Step 3: Data ── */}
          {step === 3 && (
            <div>
              <StepHeader
                step={3}
                total={5}
                title="Escolha a data"
                subtitle="Selecione o dia que deseja ser atendido."
              />

              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Data do agendamento
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot("");
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-900 bg-white"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <BackButton onClick={goBack} />
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedDate}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium bg-amber-400 text-zinc-900 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Horário ── */}
          {step === 4 && (
            <div>
              <StepHeader
                step={4}
                total={5}
                title="Escolha o horário"
                subtitle={`Horários disponíveis em ${formatDate(selectedDate)}.`}
              />

              {loadingSlots ? (
                <Spinner />
              ) : slots.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-zinc-400 text-sm">Nenhum horário disponível nesta data.</p>
                  <p className="text-zinc-400 text-xs mt-1">Tente escolher outro dia.</p>
                  <button
                    onClick={() => setStep(3)}
                    className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    ← Mudar data
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                          selectedSlot === slot
                            ? "bg-amber-400 border-amber-400 text-zinc-900 shadow-sm"
                            : "bg-white border-zinc-200 text-zinc-700 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <BackButton onClick={goBack} />
                    <button
                      onClick={() => setStep(5)}
                      disabled={!selectedSlot}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium bg-amber-400 text-zinc-900 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Continuar →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 5: Dados do cliente ── */}
          {step === 5 && (
            <div>
              <StepHeader
                step={5}
                total={5}
                title="Seus dados"
                subtitle="Preencha suas informações para finalizar o agendamento."
              />

              {/* Resumo */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 space-y-1.5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Resumo</p>
                <SummaryRow label="Barbeiro" value={selectedBarber!.name} />
                <SummaryRow label="Serviço" value={`${selectedService!.name} — R$ ${selectedService!.price.toFixed(2).replace(".", ",")}`} />
                <SummaryRow label="Data" value={formatDate(selectedDate)} />
                <SummaryRow label="Horário" value={selectedSlot} />
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientForm.clientName}
                    onChange={(e) => setField("clientName", e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Telefone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={clientForm.clientPhone}
                    onChange={(e) => setField("clientPhone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    E-mail <span className="text-zinc-400 font-normal text-xs">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={clientForm.clientEmail}
                    onChange={(e) => setField("clientEmail", e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Observações <span className="text-zinc-400 font-normal text-xs">(opcional)</span>
                  </label>
                  <textarea
                    value={clientForm.clientNotes}
                    onChange={(e) => setField("clientNotes", e.target.value)}
                    placeholder="Ex: prefiro degradê baixo, navalha no pescoço..."
                    rows={3}
                    maxLength={300}
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-zinc-900 resize-none"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-red-600 text-sm mt-3">{formError}</p>
              )}
              {submitError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{submitError}</p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <BackButton onClick={goBack} />
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-lg text-sm font-semibold bg-amber-400 text-zinc-900 hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                  )}
                  {submitting ? "Agendando..." : "Confirmar agendamento"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400">
            <BarberIcon className="w-4 h-4 text-zinc-900" />
          </div>
          <span className="text-white font-semibold text-sm">Barbearia</span>
        </Link>
        <Link
          href="/"
          className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    </header>
  );
}

function BackButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors ${className ?? ""}`}
    >
      ← Voltar
    </button>
  );
}

function Row({
  label,
  value,
  custom,
}: {
  label: string;
  value: string;
  custom?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-zinc-500 shrink-0">{label}</span>
      {custom ?? <span className="text-sm font-medium text-zinc-900 text-right">{value}</span>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-amber-700 font-medium shrink-0 w-20">{label}:</span>
      <span className="text-amber-900">{value}</span>
    </div>
  );
}

// ── Default export with Suspense (required for useSearchParams) ────────────────

export default function AgendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="w-7 h-7 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
        </div>
      }
    >
      <BookingWizardInner />
    </Suspense>
  );
}
