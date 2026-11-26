"use client";

import {
  DAYS_OF_WEEK,
  formatTimeShort,
  getScheduleCourse,
  getScheduleClass,
  getScheduleLecturer,
  ROOM_STATUS_META,
} from "@/lib/roomsData";
import { IconCalendar, IconLock } from "./Icons";

export default function SchedulePanel({
  schedules = [],
  rooms = [],
  selectedDay,
  onSelectDay,
  selectedRoomCode,
  onSelectRoomCode,
  loading = false,
  onQuickLockFromSchedule,
}) {
  const roomByCode = new Map(
    rooms.map((r) => [r.room_code?.toUpperCase(), r])
  );

  const uniqueRoomCodes = Array.from(
    new Set(rooms.map((r) => r.room_code).filter(Boolean))
  ).sort();

  const filteredSchedules = schedules.filter((s) => {
    if (
      selectedRoomCode &&
      s.room_code?.toUpperCase() !== selectedRoomCode.toUpperCase()
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {DAYS_OF_WEEK.map((day) => {
            const active = selectedDay === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {day.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onSelectDay("")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedDay === ""
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Semua Hari
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Ruangan:</label>
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
            Memuat jadwal kuliah...
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <IconCalendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Tidak ada jadwal ditemukan
            </p>
            <p className="text-xs text-slate-500">
              Coba pilih hari lain atau reset filter ruangan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Waktu</th>
                  <th className="px-5 py-3">Ruangan</th>
                  <th className="px-5 py-3">Mata Kuliah</th>
                  <th className="px-5 py-3">Kelas</th>
                  <th className="px-5 py-3">Status Saat Ini</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSchedules.map((sch, idx) => {
                  const room = roomByCode.get(sch.room_code?.toUpperCase());
                  const statusMeta = room
                    ? ROOM_STATUS_META[room.status] || ROOM_STATUS_META.AVAILABLE
                    : null;
                  const lecturer = getScheduleLecturer(sch);
                  const dayLabel =
                    DAYS_OF_WEEK.find((d) => d.key === sch.day_of_week)?.label ||
                    sch.day_of_week;

                  return (
                    <tr
                      key={sch.id || `${sch.room_code}-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {formatTimeShort(sch.start_time)} –{" "}
                          {formatTimeShort(sch.end_time)}
                        </span>
                        {selectedDay === "" && dayLabel && (
                          <span className="ml-2 text-xs text-slate-500">
                            {dayLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                        {sch.room_code}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {getScheduleCourse(sch)}
                        </p>
                        {lecturer && (
                          <p className="text-xs text-slate-500">{lecturer}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {getScheduleClass(sch)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {statusMeta ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.badgeClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                            />
                            {statusMeta.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {room?.status === "AVAILABLE" ? (
                          <button
                            type="button"
                            onClick={() => onQuickLockFromSchedule(room, sch)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                          >
                            <IconLock className="w-3.5 h-3.5" />
                            Gunakan Ruang
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {room ? "Sedang tidak kosong" : "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
