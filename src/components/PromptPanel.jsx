import React from 'react';

export default function PromptPanel({ prompt, copyStatus, onCopy }) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Customer Image Text</h2>
          <p className="text-sm font-medium text-slate-500">
            Copy this text when you want to create a customer-ready sofa image.
          </p>
        </div>
        <button
          className="h-10 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
          type="button"
          onClick={onCopy}
        >
          Copy Text
        </button>
      </div>

      <textarea
        className="min-h-72 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none"
        value={prompt}
        readOnly
      />

      {copyStatus ? <p className="text-sm font-semibold text-slate-600">{copyStatus}</p> : null}
    </section>
  );
}
