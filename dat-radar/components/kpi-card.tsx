interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
}

export default function KpiCard({ label, value, delta, deltaPositive }: KpiCardProps) {
  const deltaColor =
    deltaPositive === true
      ? "var(--green)"
      : deltaPositive === false
      ? "var(--red)"
      : "var(--text-secondary)";

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <span
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="text-3xl font-bold font-mono leading-none"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
      {delta !== undefined && (
        <span className="text-sm font-mono" style={{ color: deltaColor }}>
          {delta}
        </span>
      )}
    </div>
  );
}
