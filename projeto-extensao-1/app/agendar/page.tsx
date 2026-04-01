"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${day} de ${months[parseInt(m) - 1]} de ${y}`;
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function buildWhatsAppLink(
  serviceName: string,
  date: string,
  time: string,
  clientName: string,
  clientPhone: string
): string {
  const text = `Olá! Quero confirmar meu agendamento na Oreia Cuts! ✂️ Serviço: ${serviceName} 📅 Data: ${date} 🕐 Horário: ${time} 👤 Nome: ${clientName} 📱 Telefone: ${clientPhone}`;
  return `https://wa.me/5541996259916?text=${encodeURIComponent(text)}`;
}

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
    </div>
  );
}

// ── NavBar ─────────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e8e8e8]">
      <div className="max-w-xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-pole.jfif" alt="Oreia Cuts" width={32} height={32} className="rounded-md" />
          <span className="text-[#0a0a0a] text-sm font-bold uppercase tracking-[0.2em]">
            Oreia Cuts
          </span>
        </Link>
        <Link
          href="/"
          className="text-[#888888] hover:text-[#0a0a0a] text-xs font-medium uppercase tracking-[0.1em] transition-colors duration-200"
        >
          ← Voltar
        </Link>
      </div>
    </header>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────────

const STEP_LABELS = ["Serviço", "Data & Hora", "Seus Dados"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="bg-[#f5f5f5] border-b border-[#e8e8e8] px-5 sm:px-8 py-4">
      <div className="max-w-xl mx-auto flex items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                    done
                      ? "bg-[#cc0000] text-white"
                      : active
                      ? "bg-[#0a0a0a] text-white"
                      : "bg-[#e8e8e8] text-[#888888]"
                  }`}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    n
                  )}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block whitespace-nowrap transition-colors ${
                    active ? "text-[#0a0a0a] font-semibold" : done ? "text-[#cc0000]" : "text-[#888888]"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-4 sm:mb-0 transition-colors duration-200 ${
                    done ? "bg-[#cc0000]" : "bg-[#e8e8e8]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────────

function BookingWizardInner() {
  const searchParams = useSearchParams();
  const preselectedBarberId = searchParams.get("barbeiro");
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formError, setFormError] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  // Load barbers — auto-select if only one
  useEffect(() => {
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((d) => {
        const list: Barber[] = d.data ?? [];
        setBarbers(list);
        if (preselectedBarberId) {
          const found = list.find((b) => b._id === preselectedBarberId);
          if (found) setSelectedBarber(found);
        } else if (list.length === 1) {
          setSelectedBarber(list[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBarbers(false));
  }, [preselectedBarberId]);

  // Load services
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  // Load slots when barber + service + date are selected
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

  async function handleSubmit() {
    if (!clientName.trim()) { setFormError("Informe seu nome."); return; }
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, "").length < 10) {
      setFormError("Informe um telefone válido.");
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

  // ── Tela de sucesso ──────────────────────────────────────────────────────────

  if (booking) {
    const waLink = buildWhatsAppLink(
      booking.serviceId?.name,
      formatDate(booking.date),
      booking.timeSlot,
      booking.clientName,
      clientPhone
    );

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="w-full max-w-md">

            {/* Ícone de sucesso */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-[#f5f5f5] border-2 border-[#cc0000] flex items-center justify-center">
                <svg className="w-9 h-9 text-[#cc0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-10">
              <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-3">
                Agendamento registrado
              </p>
              <h1 className="font-display text-3xl font-bold text-[#0a0a0a] mb-3">
                Tudo certo!
              </h1>
              <p className="text-[#888888] text-sm leading-relaxed">
                Confirme pelo WhatsApp para garantir seu horário.
              </p>
            </div>

            {/* Resumo */}
            <div className="bg-[#f5f5f5] border border-[#e8e8e8] p-6 mb-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">
                Resumo
              </p>
              {[
                { label: "Serviço", value: booking.serviceId?.name },
                { label: "Data", value: formatDate(booking.date) },
                { label: "Horário", value: `${booking.timeSlot} – ${booking.endTime}` },
                { label: "Nome", value: booking.clientName },
                { label: "Valor", value: `R$ ${booking.serviceId?.price?.toFixed(2).replace(".", ",")}` },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 text-sm border-b border-[#e8e8e8] pb-3 last:border-0 last:pb-0">
                  <span className="text-[#888888]">{row.label}</span>
                  <span className="text-[#0a0a0a] font-semibold text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {/* CTA WhatsApp */}
            <div className="flex flex-col gap-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#25d366] text-white text-sm font-bold uppercase tracking-[0.1em] py-4 hover:bg-[#1fb959] transition-colors duration-200 min-h-[56px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Confirmar pelo WhatsApp
              </a>
              <Link
                href="/"
                className="w-full flex items-center justify-center border border-[#e8e8e8] text-[#888888] hover:text-[#0a0a0a] hover:border-[#0a0a0a] text-xs font-bold uppercase tracking-[0.15em] py-4 transition-colors duration-200 min-h-[48px]"
              >
                Voltar ao início
              </Link>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────────

  const isLoading = loadingBarbers || loadingServices;

  return (
    <div className="min-h-screen bg-white flex flex-col" ref={topRef}>
      <NavBar />
      <ProgressBar step={step} />

      <div className="flex-1 px-5 sm:px-8 py-10">
        <div className="max-w-xl mx-auto">

          {isLoading ? (
            <Spinner />
          ) : (
            <>
              {/* ── PASSO 1: Serviço ── */}
              {step === 1 && (
                <div>
                  <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-2">
                    Passo 1 de 3
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0a0a0a] mb-2">
                    Escolha o serviço
                  </h2>
                  <p className="text-[#888888] text-sm mb-8">
                    Toque no serviço que você quer realizar.
                  </p>

                  {/* Seleção de barbeiro (só aparece se houver mais de 1) */}
                  {barbers.length > 1 && (
                    <div className="mb-8">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#888888] mb-3">
                        Barbeiro
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {barbers.map((b) => (
                          <button
                            key={b._id}
                            onClick={() => setSelectedBarber(b)}
                            className={`px-4 py-2.5 border text-sm font-semibold transition-colors duration-200 min-h-[48px] ${
                              selectedBarber?._id === b._id
                                ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                                : "bg-white text-[#0a0a0a] border-[#e8e8e8] hover:border-[#0a0a0a]"
                            }`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {services.length === 0 ? (
                    <p className="text-[#888888] text-sm text-center py-10">Nenhum serviço disponível.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((service) => {
                        const active = selectedService?._id === service._id;
                        return (
                          <button
                            key={service._id}
                            onClick={() => {
                              setSelectedService(service);
                              setSelectedDate("");
                              setSelectedSlot("");
                              if (selectedBarber) setStep(2);
                            }}
                            disabled={barbers.length > 1 && !selectedBarber}
                            className={`w-full text-left p-5 border-2 transition-all duration-200 min-h-[80px] ${
                              active
                                ? "border-[#cc0000] bg-[#fff5f5]"
                                : "border-[#e8e8e8] bg-white hover:border-[#cc0000] hover:bg-[#fff5f5]"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <span className="font-bold text-[#0a0a0a] text-sm leading-snug">
                                {service.name}
                              </span>
                              <span className="text-[#cc0000] font-bold text-base shrink-0 tabular-nums">
                                R${service.price.toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                            {service.description && (
                              <p className="text-[#888888] text-xs leading-relaxed line-clamp-1">
                                {service.description}
                              </p>
                            )}
                            <p className="text-[#888888] text-xs mt-2 uppercase tracking-[0.1em]">
                              {service.durationMinutes} min
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {barbers.length > 1 && !selectedBarber && (
                    <p className="text-[#888888] text-xs mt-4 text-center">
                      Selecione um barbeiro para continuar.
                    </p>
                  )}
                </div>
              )}

              {/* ── PASSO 2: Data & Hora ── */}
              {step === 2 && (
                <div>
                  <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-2">
                    Passo 2 de 3
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0a0a0a] mb-2">
                    Escolha data e horário
                  </h2>
                  <p className="text-[#888888] text-sm mb-8">
                    Selecione o dia e o horário disponível.
                  </p>

                  {/* Serviço selecionado (mini resumo) */}
                  <div className="flex items-center justify-between bg-[#f5f5f5] border border-[#e8e8e8] px-4 py-3 mb-8">
                    <div>
                      <span className="text-xs text-[#888888] uppercase tracking-[0.1em]">Serviço</span>
                      <p className="text-[#0a0a0a] font-semibold text-sm">{selectedService?.name}</p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-[#0047ab] text-xs font-bold uppercase tracking-[0.1em] hover:text-[#cc0000] transition-colors"
                    >
                      Trocar
                    </button>
                  </div>

                  {/* Data */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#0a0a0a] mb-3">
                      Data
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={today}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot("");
                      }}
                      className="w-full px-4 py-3.5 border-2 border-[#e8e8e8] bg-white text-[#0a0a0a] text-sm focus:outline-none focus:border-[#cc0000] transition-colors duration-200 min-h-[52px]"
                    />
                  </div>

                  {/* Horários */}
                  {selectedDate && (
                    <div className="mb-8">
                      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#0a0a0a] mb-3">
                        Horário disponível
                      </label>
                      {loadingSlots ? (
                        <Spinner />
                      ) : slots.length === 0 ? (
                        <div className="bg-[#f5f5f5] border border-[#e8e8e8] px-5 py-6 text-center">
                          <p className="text-[#888888] text-sm mb-1">Nenhum horário disponível neste dia.</p>
                          <p className="text-[#888888] text-xs">Tente escolher outra data.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-3 text-sm font-bold border-2 transition-colors duration-200 min-h-[48px] ${
                                selectedSlot === slot
                                  ? "bg-[#cc0000] border-[#cc0000] text-white"
                                  : "bg-white border-[#e8e8e8] text-[#0a0a0a] hover:border-[#cc0000]"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold uppercase tracking-[0.1em] text-[#888888] hover:text-[#0a0a0a] transition-colors duration-200 min-h-[48px]"
                    >
                      ← Voltar
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!selectedDate || !selectedSlot}
                      className="bg-[#cc0000] text-white text-sm font-bold uppercase tracking-[0.15em] px-8 py-3.5 hover:bg-[#aa0000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 min-h-[52px]"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* ── PASSO 3: Dados pessoais ── */}
              {step === 3 && (
                <div>
                  <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-2">
                    Passo 3 de 3
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0a0a0a] mb-2">
                    Seus dados
                  </h2>
                  <p className="text-[#888888] text-sm mb-8">
                    Quase lá! Só seu nome e telefone.
                  </p>

                  {/* Resumo */}
                  <div className="bg-[#f5f5f5] border border-[#e8e8e8] p-5 mb-8 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">
                      Resumo do agendamento
                    </p>
                    {[
                      { label: "Serviço", value: selectedService!.name },
                      { label: "Valor", value: `R$ ${selectedService!.price.toFixed(2).replace(".", ",")}` },
                      { label: "Data", value: formatDate(selectedDate) },
                      { label: "Horário", value: selectedSlot },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-sm border-b border-[#e8e8e8] pb-2.5 last:border-0 last:pb-0">
                        <span className="text-[#888888]">{row.label}</span>
                        <span className="text-[#0a0a0a] font-semibold">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Formulário */}
                  <div className="space-y-5 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#0a0a0a] mb-2">
                        Nome completo <span className="text-[#cc0000]">*</span>
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => { setClientName(e.target.value); setFormError(""); }}
                        placeholder="Seu nome"
                        autoComplete="name"
                        className="w-full px-4 py-3.5 border-2 border-[#e8e8e8] bg-white text-[#0a0a0a] text-base placeholder:text-[#cccccc] focus:outline-none focus:border-[#cc0000] transition-colors duration-200 min-h-[52px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#0a0a0a] mb-2">
                        Telefone / WhatsApp <span className="text-[#cc0000]">*</span>
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => { setClientPhone(maskPhone(e.target.value)); setFormError(""); }}
                        placeholder="(41) 99999-9999"
                        autoComplete="tel"
                        inputMode="numeric"
                        className="w-full px-4 py-3.5 border-2 border-[#e8e8e8] bg-white text-[#0a0a0a] text-base placeholder:text-[#cccccc] focus:outline-none focus:border-[#cc0000] transition-colors duration-200 min-h-[52px]"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-[#fff5f5] border border-[#cc0000]/30 px-4 py-3 mb-6">
                      <p className="text-[#cc0000] text-sm font-medium">{formError}</p>
                    </div>
                  )}
                  {submitError && (
                    <div className="bg-[#fff5f5] border border-[#cc0000]/30 px-4 py-3 mb-6">
                      <p className="text-[#cc0000] text-sm font-medium">{submitError}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-bold uppercase tracking-[0.1em] text-[#888888] hover:text-[#0a0a0a] transition-colors duration-200 min-h-[48px]"
                    >
                      ← Voltar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2.5 bg-[#cc0000] text-white text-sm font-bold uppercase tracking-[0.15em] px-8 py-3.5 hover:bg-[#aa0000] disabled:opacity-50 transition-colors duration-200 min-h-[52px]"
                    >
                      {submitting && (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      )}
                      {submitting ? "Agendando..." : "Confirmar Agendamento"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Export com Suspense ────────────────────────────────────────────────────────

export default function AgendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
        </div>
      }
    >
      <BookingWizardInner />
    </Suspense>
  );
}
