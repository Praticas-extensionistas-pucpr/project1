type Status = "pending" | "confirmed" | "cancelled" | "completed";

const config: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "Aguardando",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-blue-50 text-[#0047ab] border border-blue-200",
  },
  completed: {
    label: "Concluído",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-50 text-[#cc0000] border border-red-200",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = config[status as Status] ?? {
    label: status,
    className: "bg-[#f5f5f5] text-[#888888] border border-[#e8e8e8]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-[0.05em] ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
