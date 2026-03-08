type Status = "pending" | "confirmed" | "cancelled" | "completed";

const config: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "Aguardando",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  completed: {
    label: "Concluído",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = config[status as Status] ?? {
    label: status,
    className: "bg-zinc-100 text-zinc-700 border border-zinc-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
