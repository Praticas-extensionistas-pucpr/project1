type Status = "pending" | "confirmed" | "cancelled" | "completed";

const config: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "Aguardando",
    className: "bg-[#3a2200] text-[#ffaa00] border border-[#664400]",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-[#001a4d] text-[#0080ff] border border-[#003366]",
  },
  completed: {
    label: "Concluínído",
    className: "bg-[#003300] text-[#00cc00] border border-[#006600]",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-[#330000] text-[#ff4444] border border-[#660000]",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = config[status as Status] ?? {
    label: status,
    className: "bg-[#1a1a1a] text-[#666666] border border-[#2a2a2a]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
