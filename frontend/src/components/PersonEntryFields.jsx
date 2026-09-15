import { useState } from "react";
import { fmt } from "../utils/daybook";
import {
  PERSON_NAME_FIELDS,
  normalizeExpenseSubnames,
} from "../utils/personNames";

export default function PersonEntryFields({
  title,
  entries,
  onClose,
  onSave,
  showCredited = false,
  partners = [],
  commonNames = [],
  onRememberNames,
  showSalaryRole = false,
  showPurchaseCreditMode = false,
}) {
  const blankRow = () => ({
    name: "",
    amount: "",
    note: "",
    ...(showCredited ? { creditedAmount: 0 } : {}),
    ...(showSalaryRole ? { role: "on-role" } : {}),
    ...(showPurchaseCreditMode
      ? { entryMode: "quantity", quantity: "", rate: "", billNo: "" }
      : {}),
  });
  const normalizePurchaseAmount = (row) => {
    if (!showPurchaseCreditMode) return row;
    if (row.entryMode !== "quantity") return row;
    const quantity = Number(row.quantity);
    const rate = Number(row.rate);
    if (!Number.isFinite(quantity) || !Number.isFinite(rate)) return row;
    return { ...row, amount: quantity * rate };
  };
  const [rows, setRows] = useState(
    entries.length > 0
      ? entries.map((row) => ({
          ...row,
          note: row.note || "",
          ...(showCredited
            ? { creditedAmount: Number(row.creditedAmount) || 0 }
            : {}),
          ...(showSalaryRole ? { role: row.role || "on-role" } : {}),
          ...(showPurchaseCreditMode
            ? {
                entryMode: row.entryMode || (row.billNo ? "bill" : "quantity"),
                quantity: row.quantity ?? "",
                rate: row.rate ?? "",
                billNo: row.billNo || "",
              }
            : {}),
        }))
      : [blankRow()],
  );
  const addRow = () => setRows((previous) => [...previous, blankRow()]);
  const updateRow = (index, key, value) =>
    setRows((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index
          ? normalizePurchaseAmount({ ...row, [key]: value })
          : row,
      ),
    );
  const selectPartner = (index, partnerId) => {
    const partner = partners.find((item) => item._id === partnerId);
    updateRow(index, "partner", partnerId || null);
    updateRow(index, "name", partner?.name || rows[index].name);
  };
  const removeRow = (index) =>
    setRows((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const listId = `common-names-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <div>
            <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {title}
            </h4>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Add names and amounts. Saved names can be selected below.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          {rows.map((row, index) => {
            const amount = Number(row.amount) || 0;
            const left = Math.max(0, amount - Math.min(Number(row.creditedAmount) || 0, amount));
            return (
              <div
                key={index}
                className="rounded-xl border p-2.5"
                style={{
                  borderColor: "var(--border-sub)",
                  background: showCredited ? "var(--bg-elevated)" : "transparent",
                }}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_7rem_auto] sm:flex gap-2 items-center">
                  {partners.length > 0 && (
                    <select
                      value={row.partner || ""}
                      onChange={(event) => selectPartner(index, event.target.value)}
                      className="col-span-3 sm:w-40 px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    >
                      <option value="">Select partner</option>
                      {partners.map((partner) => (
                        <option key={partner._id} value={partner._id}>{partner.name}</option>
                      ))}
                    </select>
                  )}
                  {showSalaryRole && (
                    <label className="col-span-3 sm:w-32 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Role
                      <select
                        value={row.role || "on-role"}
                        onChange={(event) => updateRow(index, "role", event.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      >
                        <option value="on-role">On-role</option>
                        <option value="off-role">Off-role</option>
                      </select>
                    </label>
                  )}
                  {showPurchaseCreditMode && (
                    <label className="col-span-3 sm:w-32 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Entry
                      <select
                        value={row.entryMode || "quantity"}
                        onChange={(event) => updateRow(index, "entryMode", event.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      >
                        <option value="quantity">Quantity</option>
                        <option value="bill">Bill No.</option>
                      </select>
                    </label>
                  )}
                  {showPurchaseCreditMode && (
                    <label className="col-span-3 min-w-0 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Credit Name
                      <input
                        list={listId}
                        value={row.name}
                        onChange={(event) => updateRow(index, "name", event.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                    </label>
                  )}
                  {!showPurchaseCreditMode && (
                    <label className="min-w-0 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Name
                      <input
                        list={listId}
                        value={row.name}
                        onChange={(event) => updateRow(index, "name", event.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                    </label>
                  )}
                  {showPurchaseCreditMode && row.entryMode !== "bill" && (
                    <label className="min-w-0 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Quantity
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(event) => updateRow(index, "quantity", event.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                    </label>
                  )}
                  {showPurchaseCreditMode && row.entryMode === "bill" && (
                    <label className="min-w-0 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Bill No.
                      <input
                        value={row.billNo}
                        onChange={(event) => updateRow(index, "billNo", event.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                    </label>
                  )}
                  {showPurchaseCreditMode && (
                    <label className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      Rate
                      <input
                        type="number"
                        value={row.rate}
                        onChange={(event) => updateRow(index, "rate", event.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                    </label>
                  )}
                  <label className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                    Amount
                    <input
                      type="number"
                      value={row.amount}
                      onChange={(event) => updateRow(index, "amount", event.target.value)}
                      readOnly={showPurchaseCreditMode && row.entryMode === "quantity"}
                      className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                  </label>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(index)} className="text-xs px-2 py-2 rounded-md border shrink-0" style={{ borderColor: "var(--danger-border)", color: "var(--danger-text)", background: "var(--danger-soft)" }}>
                      ✕
                    </button>
                  )}
                </div>
                {commonNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] mr-1" style={{ color: "var(--text-muted)" }}>
                      Saved names:
                    </span>
                    {commonNames.map((name) => (
                      <button
                        type="button"
                        key={name}
                        onClick={() => updateRow(index, "name", name)}
                        className="text-[10px] px-1.5 py-0.5 rounded border"
                        style={{ borderColor: "var(--accent-border)", color: "var(--accent-text)", background: "var(--accent-soft)" }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
                <label className="block mt-2 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  Note <span className="font-normal">(optional)</span>
                  <input
                    value={row.note}
                    onChange={(event) => updateRow(index, "note", event.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border text-xs font-normal outline-none"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </label>
                {showCredited && (
                  <div className="flex items-center gap-2 mt-2 pl-0.5">
                    <label className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Credited so far</label>
                    <input
                      type="number"
                      min={0}
                      max={amount || undefined}
                      value={row.creditedAmount}
                      onChange={(event) => updateRow(index, "creditedAmount", event.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                    <span className="text-xs font-semibold ml-auto" style={{ color: left > 0 ? "#eab308" : "#22c55e" }}>
                      {left > 0 ? `Left: ₹${fmt(left)}` : "Fully credited"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          <datalist id={listId}>
            {commonNames.map((name) => <option key={name} value={name} />)}
          </datalist>
          <button type="button" onClick={addRow} className="w-full px-3 py-2 rounded-lg border text-xs font-semibold" style={{ borderColor: "var(--accent-border)", color: "var(--accent-text)", background: "var(--accent-soft)" }}>
            + Add another row
          </button>
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border-sub)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Total: ₹{fmt(total)}</span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: "var(--border)", color: "var(--text-sec)", background: "var(--bg-elevated)" }}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const savedRows = rows
                    .map((row) => ({
                      ...row,
                      name:
                        row.name ||
                        (row.entryMode === "bill" && row.billNo
                          ? `Bill ${row.billNo}`
                          : row.quantity
                            ? `Qty ${row.quantity}`
                            : ""),
                    }))
                    .filter((row) => row.name || row.amount);
                  onRememberNames?.(savedRows);
                  onSave(savedRows);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PersonNamesSettings({ names, tabNames = {}, onSave, onClose }) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      PERSON_NAME_FIELDS.map(({ key }) => [
        key,
        key === "expenseSubnames"
          ? normalizeExpenseSubnames(names[key])
          : [...(names[key] || [])],
      ]),
    ),
  );
  const [newNames, setNewNames] = useState({});
  const [draftTabNames, setDraftTabNames] = useState(() => ({
    kitchenSale: [...(tabNames.kitchenSale || [])],
    coffeeShop: [...(tabNames.coffeeShop || [])],
    counterSale: [...(tabNames.counterSale || [])],
  }));
  const addName = (key) => {
    const value = (newNames[key] || "").trim();
    if (key === "expenseSubnames") return;
    if (!value || draft[key].some((name) => name.toLowerCase() === value.toLowerCase())) return;
    setDraft((previous) => ({ ...previous, [key]: [...previous[key], value] }));
    setNewNames((previous) => ({ ...previous, [key]: "" }));
  };
  const addExpenseCategory = () => {
    const value = (newNames.expenseCategory || "").trim();
    if (!value || Object.keys(draft.expenseSubnames).some((name) => name.toLowerCase() === value.toLowerCase())) return;
    setDraft((previous) => ({
      ...previous,
      expenseSubnames: { ...previous.expenseSubnames, [value]: [] },
    }));
    setNewNames((previous) => ({ ...previous, expenseCategory: "" }));
  };
  const addExpenseSubname = (category) => {
    const value = (newNames[`expense:${category}`] || "").trim();
    if (!value || draft.expenseSubnames[category]?.some((name) => name.toLowerCase() === value.toLowerCase())) return;
    setDraft((previous) => ({
      ...previous,
      expenseSubnames: {
        ...previous.expenseSubnames,
        [category]: [...(previous.expenseSubnames[category] || []), value],
      },
    }));
    setNewNames((previous) => ({ ...previous, [`expense:${category}`]: "" }));
  };
  const removeExpenseSubname = (category, subname) =>
    setDraft((previous) => ({
      ...previous,
      expenseSubnames: {
        ...previous.expenseSubnames,
        [category]: previous.expenseSubnames[category].filter((name) => name !== subname),
      },
    }));
  const removeExpenseCategory = (category) =>
    setDraft((previous) => {
      const expenseSubnames = { ...previous.expenseSubnames };
      delete expenseSubnames[category];
      return { ...previous, expenseSubnames };
    });
  const removeName = (key, name) => setDraft((previous) => ({ ...previous, [key]: previous[key].filter((item) => item !== name) }));
  const addTabName = (key) => {
    const value = (newNames[`tab:${key}`] || "").trim();
    if (!value || draftTabNames[key].some((name) => name.toLowerCase() === value.toLowerCase())) return;
    setDraftTabNames((previous) => ({ ...previous, [key]: [...previous[key], value] }));
    setNewNames((previous) => ({ ...previous, [`tab:${key}`]: "" }));
  };
  const removeTabName = (key, name) =>
    setDraftTabNames((previous) => ({ ...previous, [key]: previous[key].filter((item) => item !== name) }));

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)" }} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Common Names</h3>
          <button type="button" onClick={onClose} style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Save names once and select them while adding entries. You can still type a new name directly.</p>
        <div className="space-y-4">{[
            ["kitchenSale", "Kitchen Sale"],
            ["coffeeShop", "Coffee Shop"],
            ["counterSale", "Counter Sale"],
          ].map(([key, label]) => (
            <section key={`tabs-${key}`}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-sec)" }}>
                {label} tab names
              </label>
              <div className="flex gap-2">
                <input
                  value={newNames[`tab:${key}`] || ""}
                  onChange={(event) => setNewNames((previous) => ({ ...previous, [`tab:${key}`]: event.target.value }))}
                  onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addTabName(key))}
                  placeholder={`Add ${label.toLowerCase()} tab name`}
                  className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <button type="button" onClick={() => addTabName(key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--accent)" }}>Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {draftTabNames[key].map((name) => (
                  <button type="button" key={name} onClick={() => removeTabName(key, name)} className="text-xs px-2 py-1 rounded-full border" title="Remove tab name" style={{ borderColor: "var(--accent-border)", color: "var(--accent-text)", background: "var(--accent-soft)" }}>{name} ×</button>
                ))}
              </div>
            </section>
          ))}
          {PERSON_NAME_FIELDS.filter(({ key }) => key !== "expenseSubnames").map(({ key, label }) => (
            <section key={key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-sec)" }}>{label}</label>
              <div className="flex gap-2">
                <input value={newNames[key] || ""} onChange={(event) => setNewNames((previous) => ({ ...previous, [key]: event.target.value }))} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addName(key))} placeholder={`Add ${label.toLowerCase()} name`} className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <button type="button" onClick={() => addName(key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--accent)" }}>Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {draft[key].map((name) => <button type="button" key={name} onClick={() => removeName(key, name)} className="text-xs px-2 py-1 rounded-full border" title="Remove name" style={{ borderColor: "var(--accent-border)", color: "var(--accent-text)", background: "var(--accent-soft)" }}>{name} ×</button>)}
              </div>
            </section>
          ))}
          
          <section>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-sec)" }}>
              Expense subnames
            </label>
            <div className="flex gap-2">
              <input
                value={newNames.expenseCategory || ""}
                onChange={(event) => setNewNames((previous) => ({ ...previous, expenseCategory: event.target.value }))}
                onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addExpenseCategory())}
                placeholder="Add outer category, e.g. Ration"
                className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
              <button type="button" onClick={addExpenseCategory} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--accent)" }}>Add category</button>
            </div>
            <div className="space-y-3 mt-3">
              {Object.entries(draft.expenseSubnames).map(([category, subnames]) => (
                <div key={category} className="rounded-xl border p-3" style={{ borderColor: "var(--border-sub)", background: "var(--bg-elevated)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{category}</span>
                    <button type="button" onClick={() => removeExpenseCategory(category)} className="text-xs" style={{ color: "var(--danger-text)" }}>Remove</button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newNames[`expense:${category}`] || ""}
                      onChange={(event) => setNewNames((previous) => ({ ...previous, [`expense:${category}`]: event.target.value }))}
                      onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addExpenseSubname(category))}
                      placeholder="Add inner subname"
                      className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                    <button type="button" onClick={() => addExpenseSubname(category)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {subnames.map((subname) => (
                      <button type="button" key={subname} onClick={() => removeExpenseSubname(category, subname)} className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "var(--accent-border)", color: "var(--accent-text)", background: "var(--accent-soft)" }}>
                        {category} / {subname} ×
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t" style={{ borderColor: "var(--border-sub)" }}>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: "var(--border)", color: "var(--text-sec)" }}>Cancel</button>
          <button type="button" onClick={() => onSave(draft, draftTabNames)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--accent)" }}>Save Names</button>
        </div>
      </div>
    </div>
  );
}
