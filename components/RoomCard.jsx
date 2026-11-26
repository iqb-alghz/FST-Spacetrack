"use client";

import Link from "next/link";
import {
  IconLock,
  IconClock,
  IconCamera,
  IconUsers,
  IconArrowRight,
} from "./Icons";
import {
  ROOM_STATUS_META,
  formatRemainingTime,
  formatTimeShort,
  getScheduleCourse,
  getScheduleClass,
} from "@/lib/roomsData";

export default function RoomCard({
  room,
  nowMs = null,
  nextSchedule = null,
  verifyToken = null,
  onLockClick,
  onDetailClick,
}) {
  const meta = ROOM_STATUS_META[room.status] || ROOM_STATUS_META.AVAILABLE;
  const remaining =
    room.status === "LOCKED" && nowMs !== null
      ? formatRemainingTime(room.locked_until, nowMs)
      : null;

  return (
    <article
      className={`group flex flex-col justify-between rounded-2xl border border-slate-200 border-t-4 ${meta.accentBorder} bg-white p-5 shadow-2xs hover:shadow-md transition-all`}
    >
      <div className="space-y-3.5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
                {room.room_code}
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                Lt. {room.floor}
              </span>
            </div>
            {(room.room_name || room.capacity) && (
              <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                {room.room_name && (
                  <span className="truncate">{room.room_name}</span>
                )}
                {room.capacity && (
                  <span className="inline-flex items-center gap-0.5 shrink-0 text-slate-400">
                    • <IconUsers className="w-3 h-3" /> {room.capacity}
                  </span>
                )}
              </p>
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${meta.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
            {meta.label}
          </span>
        </div>

        {/* Status Body */}
        {room.status === "AVAILABLE" ? (
          <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 space-y-1.5 min-h-[78px] flex flex-col justify-center">
            <p className="text-xs font-medium text-emerald-700">
              Siap digunakan untuk perkuliahan
            </p>
            {nextSchedule ? (
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Jadwal hari ini:{" "}
                <span className="font-mono font-medium text-slate-700">
                  {formatTimeShort(nextSchedule.start_time)}
                </span>{" "}
                {getScheduleCourse(nextSchedule)} (
                {getScheduleClass(nextSchedule)})
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Tidak ada jadwal terikat saat ini
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5 min-h-[78px]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                {room.current_course || "Perkuliahan Aktif"}
              </p>
              {remaining && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold shrink-0 ${
                    remaining.isUrgent
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <IconClock className="w-3 h-3" />
                  {remaining.expired ? "00:00" : remaining.formatted}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="rounded bg-white px-1.5 py-0.5 font-medium border border-slate-200/80">
                {room.current_class || "-"}
              </span>
              <span className="truncate max-w-[140px] text-slate-500">
                {room.locked_by || "-"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        {room.status === "AVAILABLE" ? (
          <>
            <button
              type="button"
              onClick={() => onLockClick(room)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <IconLock className="w-3.5 h-3.5" />
              Kunci Ruang
            </button>
            <button
              type="button"
              onClick={() => onDetailClick(room)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Detail
            </button>
          </>
        ) : room.status === "LOCKED" ? (
          <>
            <Link
              href={
                verifyToken
                  ? `/verify?token=${encodeURIComponent(verifyToken)}`
                  : "/verify"
              }
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              <IconCamera className="w-3.5 h-3.5" />
              Check-in
              <IconArrowRight className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={() => onDetailClick(room)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Detail
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onDetailClick(room)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Lihat Detail / Kosongkan
          </button>
        )}
      </div>
    </article>
  );
}
