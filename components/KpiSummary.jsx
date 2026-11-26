"use client";

export default function KpiSummary({
  stats,
  floorCount,
  activeTab,
  selectedStatus,
  onSelectStatus,
}) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <button
        type="button"
        onClick={() => onSelectStatus("ALL")}
        className={`text-left rounded-2xl border p-4 transition-all ${
          activeTab === "rooms" && selectedStatus === "ALL"
            ? "border-slate-900 bg-white ring-1 ring-slate-900/10 shadow-xs"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <p className="text-xs font-medium text-slate-500">Total Ruangan</p>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {stats.total}
          </span>
          <span className="text-xs text-slate-400">{floorCount} lantai</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelectStatus("AVAILABLE")}
        className={`text-left rounded-2xl border p-4 transition-all ${
          activeTab === "rooms" && selectedStatus === "AVAILABLE"
            ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20 shadow-xs"
            : "border-slate-200 bg-white hover:border-emerald-300"
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Tersedia
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {stats.available}
          </span>
          <span className="text-xs text-emerald-600 font-medium">
            Siap kunci
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelectStatus("LOCKED")}
        className={`text-left rounded-2xl border p-4 transition-all ${
          activeTab === "rooms" && selectedStatus === "LOCKED"
            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-xs"
            : "border-slate-200 bg-white hover:border-amber-300"
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Menunggu Check-in
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {stats.locked}
          </span>
          <span className="text-xs text-amber-700 font-medium">
            Batas 15 mnt
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelectStatus("OCCUPIED")}
        className={`text-left rounded-2xl border p-4 transition-all ${
          activeTab === "rooms" && selectedStatus === "OCCUPIED"
            ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20 shadow-xs"
            : "border-slate-200 bg-white hover:border-rose-300"
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Sedang Dipakai
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {stats.occupied}
          </span>
          <span className="text-xs text-rose-600 font-medium">
            Terverifikasi
          </span>
        </div>
      </button>
    </section>
  );
}
