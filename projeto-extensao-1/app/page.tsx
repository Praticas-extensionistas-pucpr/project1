"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xl font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function Home() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((d) => setBarbers(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingBarbers(false));

    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── Navbar ── */}
      <header className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-pole.jfif"
              alt="Oreia Cuts Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-white font-semibold text-sm">Oreia Cuts</span>
          </div>
          <Link
            href="/barber/login"
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            Área do Barbeiro →
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#0a0a0a] pt-16 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6">
            <Image
              src="/logo-navalha.jfif"
              alt="Oreia Cuts Navalha"
              width={80}
              height={80}
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Agende o seu corte<br />
            <span className="text-[#cc0000]">sem complicação</span>
          </h1>
          <p className="text-[#999999] text-lg mb-8 max-w-lg mx-auto">
            Escolha seu barbeiro, o serviço e o horário que preferir. Tudo online, rápido e fácil.
          </p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 bg-[#cc0000] text-white font-semibold px-8 py-3.5 rounded-full text-base hover:bg-[#ff0000] transition-colors shadow-lg"
          >
            Agendar agora
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Escolha o barbeiro",
                desc: "Veja nossos profissionais e escolha o que preferir.",
                icon: (
                  <svg className="w-6 h-6 text-[#cc0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Selecione o serviço e horário",
                desc: "Escolha o serviço desejado e um horário disponível.",
                icon: (
                  <svg className="w-6 h-6 text-[#cc0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Confirme o agendamento",
                desc: "Informe seus dados e pronto — até lá!",
                icon: (
                  <svg className="w-6 h-6 text-[#cc0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#cc0000]">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#cc0000] uppercase tracking-widest mb-1">
                    Passo {item.step}
                  </p>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-[#999999] text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Barbeiros ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Nossos Barbeiros</h2>
            <Link
              href="/agendar"
              className="text-sm text-[#cc0000] hover:text-[#ff0000] font-medium"
            >
              Agendar →
            </Link>
          </div>

          {loadingBarbers ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-[#1a1a1a] border-t-[#cc0000] rounded-full animate-spin" />
            </div>
          ) : barbers.length === 0 ? (
            <p className="text-[#666666] text-center py-10 text-sm">Nenhum barbeiro disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {barbers.map((barber) => (
                <div
                  key={barber._id}
                  className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm p-5 flex items-start gap-4"
                >
                  {barber.avatarUrl ? (
                    <img
                      src={barber.avatarUrl}
                      alt={barber.name}
                      className="w-16 h-16 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <AvatarPlaceholder name={barber.name} />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{barber.name}</h3>
                    {barber.bio && (
                      <p className="text-[#999999] text-sm mt-1 line-clamp-2">{barber.bio}</p>
                    )}
                    <Link
                      href={`/agendar?barbeiro=${barber._id}`}
                      className="inline-block mt-3 text-xs font-medium text-white bg-[#cc0000] hover:bg-[#ff0000] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Agendar com este barbeiro
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Serviços ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Serviços disponíveis</h2>

          {loadingServices ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-[#1a1a1a] border-t-[#cc0000] rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-[#666666] text-center py-10 text-sm">Nenhum serviço disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white">{service.name}</h3>
                    <span className="text-base font-bold text-[#cc0000] shrink-0">
                      R$ {service.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-[#999999] text-sm mb-3">{service.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-[#666666] text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.durationMinutes} min
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 bg-[#cc0000] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#ff0000] transition-colors"
            >
              Quero agendar
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-pole.jfif"
              alt="Oreia Cuts"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-white font-semibold text-sm">Oreia Cuts</span>
          </div>
          <p className="text-[#666666] text-xs">
            © {new Date().getFullYear()} Oreia Cuts. Todos os direitos reservados.
          </p>
          <Link href="/barber/login" className="text-[#666666] hover:text-[#cc0000] text-xs transition-colors">
            Área do Barbeiro
          </Link>
        </div>
      </footer>
    </div>
  );
}
