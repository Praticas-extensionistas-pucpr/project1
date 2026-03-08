import BarberShell from "@/app/barber/_components/BarberShell";

/**
 * Layout da área protegida do barbeiro.
 * Aplica o guard de autenticação + sidebar.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <BarberShell>{children}</BarberShell>;
}
