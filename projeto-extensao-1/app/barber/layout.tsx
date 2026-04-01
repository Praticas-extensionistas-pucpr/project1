import { BarberAuthProvider } from "@/lib/contexts/BarberAuthContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";

export const metadata = {
  title: "Painel do Barbeiro | Barbearia",
};

/**
 * Layout raiz da área do barbeiro.
 * Fornece o contexto de autenticação para TODAS as sub-rotas
 * (login + área protegida), sem impor o guard+sidebar aqui.
 * O guard fica em app/barber/(protected)/layout.tsx.
 */
export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarberAuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </BarberAuthProvider>
  );
}
