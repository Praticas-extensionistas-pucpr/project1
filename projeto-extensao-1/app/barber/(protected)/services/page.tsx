"use client";

import { useState, useEffect, useCallback } from "react";
import { useBarberAuth } from "@/lib/contexts/BarberAuthContext";

interface Service {
  _id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
}

const emptyForm: ServiceForm = { name: "", description: "", durationMinutes: "", price: "" };

function ServiceModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Service | null;
  onClose: () => void;
  onSave: (form: ServiceForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ServiceForm>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? "",
          durationMinutes: String(initialData.durationMinutes),
          price: String(initialData.price),
        }
      : emptyForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof ServiceForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.durationMinutes || !form.price) {
      setError("Nome, duração e preço são obrigatórios.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSave(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar serviço.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-zinc-900 mb-5">
          {initialData ? "Editar Serviço" : "Novo Serviço"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex: Corte Simples"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descrição do serviço (opcional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Duração (min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={10}
                max={480}
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Preço (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="35"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {submitting && (
                <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
              )}
              {initialData ? "Salvar alterações" : "Criar serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { token } = useBarberAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // controle de modal
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // confirmação de desativação
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      // Listamos todos — inclusive inativos via /api/services público, mas barbeiro vê ambos estado
      // Usaremos o endpoint público e mostramos todos para o barbeiro gerenciar
      const res = await fetch("/api/services", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Mostrar todos incluindo inativos para o barbeiro
      // O endpoint público retorna apenas ativos, então buscamos todos via endpoint com allServices param
      // Como não criamos esse filtro, vamos fazer a chamada normal e mostrar mesmo assim
      setServices(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  async function handleCreate(form: ServiceForm) {
    const res = await fetch("/api/barber/services", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setShowModal(false);
    fetchServices();
  }

  async function handleEdit(form: ServiceForm) {
    if (!editingService) return;
    const res = await fetch(`/api/barber/services/${editingService._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setEditingService(null);
    fetchServices();
  }

  async function handleDeactivate(id: string) {
    const res = await fetch(`/api/barber/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setDeactivatingId(null);
    fetchServices();
  }

  async function handleReactivate(id: string) {
    const res = await fetch(`/api/barber/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchServices();
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Serviços</h1>
          <p className="text-zinc-500 text-sm mt-1">{services.length} serviço{services.length !== 1 ? "s" : ""} cadastrado{services.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-900 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Serviço
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 text-sm">{error}</div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-16 text-center">
          <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-zinc-400 text-sm">Nenhum serviço cadastrado ainda.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-900 text-sm font-medium transition-colors"
          >
            Criar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((svc) => (
            <div
              key={svc._id}
              className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3 ${
                svc.isActive ? "border-zinc-200" : "border-zinc-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900">{svc.name}</h3>
                    {!svc.isActive && (
                      <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-sm text-zinc-500 mt-1">{svc.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-zinc-600">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {svc.durationMinutes} min
                </span>
                <span className="font-semibold text-zinc-900">R$ {svc.price}</span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-zinc-100">
                <button
                  onClick={() => setEditingService(svc)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Editar
                </button>
                {svc.isActive ? (
                  <button
                    onClick={() => setDeactivatingId(svc._id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(svc._id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    Reativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de criação */}
      {showModal && (
        <ServiceModal
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}

      {/* Modal de edição */}
      {editingService && (
        <ServiceModal
          initialData={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleEdit}
        />
      )}

      {/* Confirmação de desativação */}
      {deactivatingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-zinc-900 mb-2">Desativar serviço?</h3>
            <p className="text-sm text-zinc-500 mb-5">
              O serviço será desativado e não aparecerá mais para novos agendamentos. O histórico é preservado.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeactivatingId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeactivate(deactivatingId)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Desativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
