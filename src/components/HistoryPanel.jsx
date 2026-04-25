import React from 'react';

export default function HistoryPanel({ history, onLoad, onDelete, onClear }) {
  return (
    <aside
      id="sofas-demo-log"
      className="flex w-full flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur xl:h-[calc(100vh-8.75rem)] xl:w-[320px] xl:min-w-[320px] xl:sticky xl:top-28"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 p-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Sofas Demo Log</h2>
          <p className="text-sm text-slate-500">Last 10 saved designs</p>
        </div>
        <button
          className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={onClear}
          disabled={history.length === 0}
        >
          Clear
        </button>
      </div>

      <div className="grid flex-1 content-start gap-3 overflow-y-auto p-4">
        {history.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-300 p-5 text-sm font-medium text-slate-500">
            Adjust the sofa choices to create saved designs.
          </div>
        ) : (
          history.map((item) => (
            <article key={item.id} className="grid gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: item.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">{item.summary}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.theme} / {item.material} / {item.color.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="h-10 rounded-full bg-sky-600 px-3 text-sm font-bold text-white transition hover:bg-sky-700"
                  type="button"
                  onClick={() => onLoad(item.config)}
                >
                  Load
                </button>
                <button
                  className="h-10 rounded-full border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  type="button"
                  onClick={() => onDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
