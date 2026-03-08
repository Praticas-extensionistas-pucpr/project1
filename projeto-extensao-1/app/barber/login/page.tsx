"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";

export default function LoginPage() {
  const { login, token, isLoading } = useBarberAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/barber/dashboard");
    }
  }, [token, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400 mb-4">
            <svg className="w-8 h-8 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 2v2H5v2H3V2h4zm14 0v4h-2V4h-2V2h4zM3 20v-4h2v2h2v2H3zm16 0h-2v-2h2v-2h2v4h-2zM7 6v2H5v2H3V6h4zm4 0h2v2h2v2h-2v2h-2V6zm4 0h2v4h-2V6zM7 14v2H5v2H3v-4h4zm10 0h2v4h-4v-2h2v-2zm-6 0h2v4h-2v-4zm-2-4h2v2H9v-2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Barbearia</h1>
          <p className="text-zinc-400 text-sm mt-1">Acesse o painel do barbeiro</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-800 rounded-2xl p-8 shadow-xl border border-zinc-700">
          <h2 className="text-lg font-semibold text-white mb-6">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 text-zinc-900 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-900 rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Área restrita — apenas barbeiros cadastrados
        </p>
      </div>
    </div>
  );
}
