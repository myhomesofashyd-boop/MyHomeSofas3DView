import React from 'react';

export default function DemoLogPanel({ demos, onLoad, onDelete }) {
  return (
    <section
      id="customers-log"
      className="grid gap-4 rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5"
    >
      <div>
        <h2 className="text-lg font-black text-slate-950">Customers Log</h2>
        <p className="text-sm font-medium text-slate-500">Saved customer designs ready to reopen, edit, or print.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {demos.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 md:col-span-2">
            No completed demos saved yet.
          </div>
        ) : (
          demos.map((demo) => (
            <article key={demo.id} className="grid gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/85 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: demo.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">{demo.customerName} / {demo.sofaCategory}</p>
                  <p className="text-xs font-semibold text-slate-500">{demo.dimensions} / {demo.seatCount}</p>
                  <p className="text-xs font-semibold text-slate-500">{demo.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="h-10 rounded-full bg-slate-900 px-3 text-sm font-bold text-white" type="button" onClick={() => onLoad(demo)}>
                  Load
                </button>
                <button
                  className="h-10 rounded-full border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700"
                  type="button"
                  onClick={() => onDelete(demo.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
