"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnPrimary, btnGhost, inputSm } from "@/components/ui";

const EMPTY = {
  misId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  wing: "eSide",
  mandal: "",
  subgroup: "",
  center: "",
  goshthiGroup: "",
};

export function AddDelegate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/delegates", "POST", form);
      setForm({ ...EMPTY });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${btnPrimary} mb-4`}>
        Add delegate
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-card rounded-2xl border border-line p-5 mb-5">
      <h2 className="text-lg font-semibold text-ink mb-3">Add delegate</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="MIS ID" value={form.misId} onChange={(v) => set("misId", v)} required />
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Wing</label>
          <select value={form.wing} onChange={(e) => set("wing", e.target.value)} className={inputSm}>
            <option value="eSide">eSide (Kishores/Yuvaks)</option>
            <option value="iSide">iSide (Kishoris/Yuvatis)</option>
          </select>
        </div>
        <Field label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} required />
        <Field label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} />
        <Field label="Middle name" value={form.middleName} onChange={(v) => set("middleName", v)} />
        <Field label="Mandal" value={form.mandal} onChange={(v) => set("mandal", v)} />
        <Field label="Center" value={form.center} onChange={(v) => set("center", v)} />
        <Field label="Subgroup" value={form.subgroup} onChange={(v) => set("subgroup", v)} />
        <div className="col-span-2">
          <Field
            label="Goshthi group (sets track)"
            value={form.goshthiGroup}
            onChange={(v) => set("goshthiGroup", v)}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-brand text-sm font-medium mt-2">
          {error}
        </p>
      )}
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={btnGhost}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputSm}
        required={required}
      />
    </div>
  );
}
