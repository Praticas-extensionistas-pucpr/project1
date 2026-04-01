"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Service {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#cc0000] rounded-full animate-spin" />
    </div>
  );
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e8e8e8]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-pole.jfif"
              alt="Oreia Cuts"
              width={36}
              height={36}
              className="rounded-md"
            />
            <span className="text-[#0a0a0a] text-sm font-bold uppercase tracking-[0.2em]">
              Oreia Cuts
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/barber/login"
              className="hidden sm:block text-[#888888] hover:text-[#0a0a0a] text-xs font-medium uppercase tracking-[0.1em] transition-colors duration-200"
            >
              Área do Barbeiro
            </Link>
            <Link
              href="/agendar"
              className="bg-[#cc0000] text-white text-xs font-bold uppercase tracking-[0.15em] px-5 py-3 hover:bg-[#aa0000] transition-colors duration-200 min-h-[48px] flex items-center"
            >
              Agendar Agora
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-32 flex flex-col sm:flex-row items-center gap-12">
          {/* Texto */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-6">
              Barbearia • Cachoeira, Almirante Tamandaré - PR
            </p>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-6">
              Seu estilo,<br />nossa arte.
            </h1>
            <p className="text-[#888888] text-lg mb-10 leading-relaxed max-w-md">
              Agende seu horário em segundos. Sem fila, sem espera — só o melhor corte da região.
            </p>
            <Link
              href="/agendar"
              className="inline-flex items-center bg-[#cc0000] text-white text-sm font-bold uppercase tracking-[0.15em] px-8 py-4 hover:bg-[#aa0000] transition-colors duration-200 min-h-[56px]"
            >
              Agendar Agora →
            </Link>
          </div>

          {/* Logo / Visual */}
          <div className="shrink-0 flex flex-col items-center gap-4">
            <div className="border-2 border-[#cc0000] p-4 rounded-full">
              <Image
                src="/logo-navalha.jfif"
                alt="Oreia Cuts"
                width={140}
                height={140}
                className="rounded-full"
              />
            </div>
            <div className="w-12 h-0.5 bg-[#cc0000]" />
            <p className="text-[#555555] text-xs uppercase tracking-[0.2em]">Desde sempre</p>
          </div>
        </div>
      </section>

      {/* ── Como Funciona ── */}
      <section className="bg-[#f5f5f5] border-b border-[#e8e8e8] py-16 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: "1", title: "Escolha o serviço", desc: "Selecione o corte ou serviço que você quer." },
              { n: "2", title: "Escolha data e hora", desc: "Veja os horários disponíveis e reserve o seu." },
              { n: "3", title: "Confirme pelo WhatsApp", desc: "Finalize em segundos direto no WhatsApp." },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#cc0000] text-white font-bold text-base flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a0a0a] mb-1">{step.title}</h3>
                  <p className="text-[#888888] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Serviços ── */}
      <section className="py-20 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-3">
            Serviços
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0a0a0a] mb-12">
            O que fazemos
          </h2>

          {loadingServices ? (
            <Spinner />
          ) : services.length === 0 ? (
            <p className="text-[#888888] text-sm">Nenhum serviço disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-[#f5f5f5] border border-[#e8e8e8] p-5 hover:border-[#cc0000] transition-colors duration-200 group flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-[#0a0a0a] font-semibold text-sm leading-snug">
                      {service.name}
                    </h3>
                    <span className="text-[#cc0000] font-bold text-sm shrink-0 tabular-nums">
                      R${service.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-[#888888] text-xs mb-3 leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#e8e8e8]">
                    <span className="text-[#888888] text-xs uppercase tracking-[0.1em]">
                      {service.durationMinutes} min
                    </span>
                    <Link
                      href="/agendar"
                      className="text-[#0047ab] text-xs font-bold uppercase tracking-[0.1em] hover:text-[#cc0000] transition-colors duration-200"
                    >
                      Agendar →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/agendar"
              className="inline-flex items-center bg-[#cc0000] text-white text-sm font-bold uppercase tracking-[0.15em] px-8 py-4 hover:bg-[#aa0000] transition-colors duration-200 min-h-[56px]"
            >
              Agendar Agora
            </Link>
          </div>
        </div>
      </section>

      {/* ── Localização ── */}
      <section className="bg-[#f5f5f5] border-t border-b border-[#e8e8e8] py-20 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-3">
            Onde estamos
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0a0a0a] mb-10">
            Localização
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Endereço */}
            <div className="bg-white border border-[#e8e8e8] p-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">
                Endereço
              </h3>
              <p className="text-[#0a0a0a] font-semibold text-lg leading-relaxed mb-2">
                Cachoeira
              </p>
              <p className="text-[#888888] text-sm">
                Almirante Tamandaré — PR
              </p>
              <div className="mt-5 pt-5 border-t border-[#e8e8e8]">
                <a
                  href="https://wa.me/5541996259916"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#0047ab] text-sm font-bold uppercase tracking-[0.1em] hover:text-[#cc0000] transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Horários */}
            <div className="bg-white border border-[#e8e8e8] p-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">
                Horário de Funcionamento
              </h3>
              <div className="space-y-3">
                {[
                  { dia: "Segunda — Sexta", hora: "09:00 – 19:00" },
                  { dia: "Sábado", hora: "08:00 – 17:00" },
                  { dia: "Domingo", hora: "Fechado" },
                ].map((item) => (
                  <div key={item.dia} className="flex items-center justify-between py-2 border-b border-[#e8e8e8] last:border-0">
                    <span className="text-[#0a0a0a] text-sm font-medium">{item.dia}</span>
                    <span className={`text-sm font-semibold ${item.hora === "Fechado" ? "text-[#888888]" : "text-[#cc0000]"}`}>
                      {item.hora}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a0a0a] py-12 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-8 pb-8 border-b border-[#1f1f1f]">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo-pole.jfif"
                alt="Oreia Cuts"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="text-white text-sm font-bold uppercase tracking-[0.2em]">
                Oreia Cuts
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <a
                href="https://wa.me/5541996259916"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#cc0000] text-white text-xs font-bold uppercase tracking-[0.1em] px-5 py-3 hover:bg-[#aa0000] transition-colors duration-200 min-h-[48px]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <Link
                href="/barber/login"
                className="text-[#555555] hover:text-white text-xs uppercase tracking-[0.1em] transition-colors duration-200"
              >
                Área do Barbeiro
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[#444444] text-xs">
            <p>© {new Date().getFullYear()} Oreia Cuts. Todos os direitos reservados.</p>
            <p>Cachoeira, Almirante Tamandaré — PR</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
