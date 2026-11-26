"use client";

import Link from "next/link";
import { IconBuilding, IconRefresh, IconCamera } from "./Icons";

export default function Navbar({
  subtitle = "Monitoring & Peminjaman Ruang Kuliah Real-time",
  demoMode = false,
  lastUpdated = null,
  loading = false,
  onRefresh = null,
  actionType = "verify", // "verify" | "back"
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <IconBuilding className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                FST-Spacetrack
              </h1>
              {demoMode && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Simulasi
                </span>
              )}
            </div>
            <p className="hidden sm:block text-xs text-slate-500">{subtitle}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Diperbarui{" "}
              {lastUpdated.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Segarkan data ruangan"
            >
              <IconRefresh
                className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`}
              />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          )}

          {actionType === "verify" ? (
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <IconCamera className="w-4 h-4" />
              <span>Verifikasi Check-in</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Kembali ke Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
