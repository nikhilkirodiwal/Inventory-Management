import { fmt } from "../utils/daybook";

export function Badge({ children, variant = "default" }) {
  const s = {
    positive: {
      background: "rgba(34,197,94,0.1)",
      color: "#22c55e",
      border: "1px solid rgba(34,197,94,0.2)",
    },
    warning: {
      background: "rgba(234,179,8,0.12)",
      color: "#eab308",
      border: "1px solid rgba(234,179,8,0.25)",
    },
    negative: {
      background: "var(--danger-soft)",
      color: "var(--danger-text)",
      border: "1px solid var(--danger-border)",
    },
    neutral: {
      background: "var(--accent-soft)",
      color: "var(--accent-text)",
      border: "1px solid var(--accent-border)",
    },
  };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={s[variant] ?? s.neutral}
    >
      {children}
    </span>
  );
}

/* Generic confirm-before-you-commit dialog. Used anywhere an action changes
   money/records and deserves an "are you sure" step (e.g. marking a Personal
   Cr entry as credited). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)" }}
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-5"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h4
          className="font-bold text-sm mb-1.5"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h4>
        <p
          className="text-sm mb-5 leading-relaxed"
          style={{ color: "var(--text-sec)" }}
        >
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-sec)",
              background: "var(--bg-elevated)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{
              background: danger ? "var(--danger-text)" : "var(--accent-text)",
              color: "#fff",
            }}
          >
            {busy ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BreakdownModal({ title, items, onClose }) {
  const total = items.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between rounded-lg px-3 py-2"
              style={{ background: "var(--bg-elevated)" }}
            >
              <span style={{ color: "var(--text-primary)" }}>{item.name}</span>
              <span
                className="font-semibold"
                style={{ color: "var(--accent-text)" }}
              >
                ₹{fmt(item.amount)}
              </span>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between px-5 py-4 border-t font-bold"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <span style={{ color: "var(--text-primary)" }}>Total</span>
          <span style={{ color: "var(--accent-text)" }}>₹{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
