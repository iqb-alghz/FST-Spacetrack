"use client";

import { formatDateTimeID } from "@/lib/roomsData";
import { IconHistory, IconCheckCircle } from "./Icons";

export default function CheckinHistoryPanel({
  checkins = [],
  rooms = [],
  selectedRoomCode,
  onSelectRoomCode,
  loading = false,
}) {
  const uniqueRoomCodes = Array.from(
    new Set(rooms.map((r) => r.room_code).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Log Verifikasi Check-in Plakat Pintu
          </h3>
          <p className="text-xs text-slate-500">
            Catatan autentikasi ruangan berbasis OCR secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">
            Filter Ruangan:
          </label>
          <select
            value={selectedRoomCode}
            onChange={(e) => onSelectRoomCode(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Semua Ruangan</option>
            {uniqueRoomCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Memuat riwayat check-in...
          </div>
        ) : checkins.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <IconHistory className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Belum ada riwayat check-in
            </p>
            <p className="text-xs text-slate-500">
              Check-in akan tercatat setelah pengunci memfoto plakat pintu di
              halaman verifikasi.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {checkins.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                    <IconCheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {item.room_code}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-sm font-medium text-slate-800">
                        {item.verified_by}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-mono">
                      Teks OCR: &ldquo;{item.ocr_raw_text}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 pl-12 sm:pl-0">
                  <span className="text-xs font-medium text-slate-700">
                    {formatDateTimeID(item.verified_at)}
                  </span>
                  {item.confidence_score !== null &&
                    item.confidence_score !== undefined && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Confidence {Math.round(item.confidence_score * 100)}%
                      </span>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
