import React from 'react';

function TextInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function DemoForm({ customer, onChange, onSaveDemo, onGeneratePdf, saveStatus, dbStatus }) {
  const update = (key, value) => onChange({ ...customer, [key]: value });

  return (
    <section className="grid gap-4 rounded-[20px] border border-slate-200/80 bg-white/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Customer Details</h2>
          <p className="text-sm font-medium text-slate-500">
            Save the order details and prepare the customer copy.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TextInput label="Customer Name" value={customer.name} required onChange={(value) => update('name', value)} />
        <TextInput label="Phone Number" value={customer.phone} required onChange={(value) => update('phone', value)} />
        <TextInput label="Alternate Phone" value={customer.alternatePhone} onChange={(value) => update('alternatePhone', value)} />
        <TextInput label="Expected Delivery Date" type="date" value={customer.expectedDeliveryDate} onChange={(value) => update('expectedDeliveryDate', value)} />
        <TextInput label="Advance Paid" type="number" value={customer.advanceAmount} onChange={(value) => update('advanceAmount', value)} />
        <TextInput label="Yet To Pay" type="number" value={customer.balanceAmount} onChange={(value) => update('balanceAmount', value)} />
      </div>

      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Address
        <textarea
          className="min-h-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={customer.address}
          onChange={(event) => update('address', event.target.value)}
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className="h-11 rounded-full bg-slate-950 px-4 font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!customer.name || !customer.phone}
          onClick={onSaveDemo}
        >
          Save Design
        </button>
        <button
          className="h-11 rounded-full border border-slate-300 bg-white px-4 font-black text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!customer.name || !customer.phone}
          onClick={onGeneratePdf}
        >
          Customer Copy
        </button>
      </div>

      {saveStatus ? <p className="text-sm font-bold text-slate-600">{saveStatus}</p> : null}
      {!dbStatus.ok && dbStatus.message ? <p className="text-xs font-semibold text-amber-700">{dbStatus.message}</p> : null}
    </section>
  );
}
