"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconLock,
  IconUnlock,
  IconDoor,
  IconX,
  IconClock,
  IconCheckCircle,
  IconCopy,
  IconArrowRight,
  IconAlert,
  IconCalendar,
  IconHistory,
} from "./Icons";
import {
  ROOM_STATUS_META,
  formatRemainingTime,
  formatTimeShort,
  formatDateTimeID,
  getScheduleCourse,
  getScheduleClass,
} from "@/lib/roomsData";

function LockModalView({
  room,
  todaySchedules,
  initialCourse,
  initialClass,
  onClose,
  onLockSubmit,
}) {
  const [course, setCourse] = useState(initialCourse);
  const [className, setClassName] = useState(initialClass);
  const [lockedBy, setLockedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lockResult, setLockResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const roomSchedules = todaySchedules.filter(
    (s) => s.room_code?.toUpperCase() === room.room_code?.toUpperCase()
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!course.trim() || !className.trim() || !lockedBy.trim()) {
      setError("Mata kuliah, kelas, dan nama pengunci wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await onLockSubmit(room.id, {
        current_course: course.trim(),
        current_class: className.trim(),
        locked_by: lockedBy.trim(),
      });
      setLockResult(result);
    } catch (err) {
      setError(err.message || "Gagal mengunci ruangan.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyLink() {
    if (!lockResult?.verify_url) return;
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${lockResult.verify_url}`
        : lockResult.verify_url;
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <IconLock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {lockResult
                ? "Ruangan Berhasil Dikunci"
                : `Kunci Ruang ${room.room_code}`}
            </h2>
            <p className="text-xs text-slate-500">
              Lantai {room.floor}
              {room.room_name ? ` • ${room.room_name}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          aria-label="Tutup modal"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      {lockResult ? (
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold">
                {room.room_code} dikunci selama 15 menit!
              </p>
              <p className="mt-1 text-emerald-700">
                Segera foto plakat pintu di lokasi untuk check-in sebelum kunci
                otomatis dilepas.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Mata Kuliah</span>
              <span className="font-medium text-slate-900 text-right">
                {lockResult.room?.current_course}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Kelas</span>
              <span className="font-medium text-slate-900">
                {lockResult.room?.current_class}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Pengunci</span>
              <span className="font-medium text-slate-900">
                {lockResult.room?.locked_by}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-500 truncate">
                Token: {lockResult.magic_token}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-100 shrink-0"
              >
                <IconCopy className="w-3.5 h-3.5" />
                {copied ? "Tersalin!" : "Salin Link"}
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Kembali ke Dashboard
            </button>
            <Link
              href={
                lockResult.verify_url ||
                `/verify?token=${lockResult.magic_token}`
              }
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Verifikasi Check-in
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 px-3.5 py-2.5 text-xs text-amber-900">
            <IconClock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Penguncian berlaku <strong>15 menit</strong>. Jika tidak check-in
              di pintu ruangan, status otomatis kembali tersedia.
            </span>
          </div>

          {roomSchedules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500">
                Isi cepat dari jadwal hari ini di {room.room_code}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roomSchedules.map((sch) => (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => {
                      setCourse(getScheduleCourse(sch));
                      setClassName(getScheduleClass(sch));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <span className="font-mono text-[11px]">
                      {formatTimeShort(sch.start_time)}
                    </span>
                    <span>• {getScheduleCourse(sch)}</span>
                    <span className="text-indigo-500">
                      ({getScheduleClass(sch)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
              <IconAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Kuliah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Contoh: Pemrograman Web"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas / Prodi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: TI-4A"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pengunci (PJ / Dosen){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lockedBy}
                  onChange={(e) => setLockedBy(e.target.value)}
                  placeholder="Contoh: Ahmad (PJ)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-xs"
            >
              <IconLock className="w-4 h-4" />
              {submitting ? "Mengunci..." : "Kunci Ruangan 15 Menit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function DetailModalView({
  room,
  nowMs,
  savedToken,
  todaySchedules,
  demoMode,
  demoCheckins,
  onClose,
  onRelease,
  onSwitchToLock,
}) {
  const [fetchedCheckins, setFetchedCheckins] = useState([]);
  const [loadingCheckins, setLoadingCheckins] = useState(!demoMode);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!room || demoMode) return;

    let cancelled = false;
    fetch(
      `/api/checkins?room_code=${encodeURIComponent(room.room_code)}&limit=5`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setFetchedCheckins(data.checkins || []);
      })
      .catch(() => {
        if (!cancelled) setFetchedCheckins([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCheckins(false);
      });

    return () => {
      cancelled = true;
    };
  }, [room, demoMode]);

  const checkins = demoMode
    ? demoCheckins.filter(
        (c) => c.room_code?.toUpperCase() === room.room_code?.toUpperCase()
      )
    : fetchedCheckins;

  const statusMeta =
    ROOM_STATUS_META[room.status] || ROOM_STATUS_META.AVAILABLE;
  const remaining =
    room.status === "LOCKED" && nowMs !== null
      ? formatRemainingTime(room.locked_until, nowMs)
      : null;
  const verifyToken = room.magic_token || savedToken;
  const roomSchedules = todaySchedules.filter(
    (s) => s.room_code?.toUpperCase() === room.room_code?.toUpperCase()
  );

  async function handleConfirmRelease() {
    setReleasing(true);
    setError("");
    try {
      await onRelease(room.id);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal mengosongkan ruangan.");
    } finally {
      setReleasing(false);
    }
  }

  return (
    <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-xs font-bold">
            <IconDoor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono text-slate-900">
                {room.room_code}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.badgeClass}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Lantai {room.floor}
              {room.room_name ? ` • ${room.room_name}` : ""}
              {room.capacity ? ` • Kapasitas ${room.capacity} kursi` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          aria-label="Tutup detail"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
            <IconAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {room.status !== "AVAILABLE" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Informasi Penggunaan Saat Ini
              </span>
              {remaining && !remaining.expired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-800">
                  <IconClock className="w-3.5 h-3.5" />
                  {remaining.formatted}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Mata Kuliah</p>
                <p className="font-semibold text-slate-900">
                  {room.current_course || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kelas</p>
                <p className="font-semibold text-slate-900">
                  {room.current_class || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pengguna / PJ</p>
                <p className="font-semibold text-slate-900">
                  {room.locked_by || "-"}
                </p>
              </div>
            </div>

            {room.status === "LOCKED" && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-600">
                  Menunggu foto plakat pintu untuk konfirmasi masuk.
                </span>
                <Link
                  href={
                    verifyToken
                      ? `/verify?token=${encodeURIComponent(verifyToken)}`
                      : "/verify"
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Lanjut Verifikasi
                  <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Ruangan sedang kosong dan siap dipakai
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Kunci sementara 15 menit sebelum menuju ruang kelas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchToLock(room)}
              className="shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Kunci Ruangan
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <IconCalendar className="w-4 h-4" />
            <span>Jadwal Hari Ini ({room.room_code})</span>
          </div>
          {roomSchedules.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-3.5 text-xs text-slate-500">
              Tidak ada jadwal reguler tercatat untuk ruangan ini hari ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {roomSchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs bg-white"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {getScheduleCourse(sch)}
                    </p>
                    <p className="text-slate-500">
                      Kelas {getScheduleClass(sch)}
                    </p>
                  </div>
                  <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                    {formatTimeShort(sch.start_time)} -{" "}
                    {formatTimeShort(sch.end_time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <IconHistory className="w-4 h-4" />
            <span>Riwayat Check-in Terbaru</span>
          </div>
          {loadingCheckins ? (
            <p className="text-xs text-slate-400">Memuat riwayat...</p>
          ) : checkins.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-3.5 text-xs text-slate-500">
              Belum ada riwayat check-in untuk {room.room_code}.
            </p>
          ) : (
            <div className="space-y-2">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {c.verified_by}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      OCR: &ldquo;{c.ocr_raw_text}&rdquo;
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-slate-600 font-medium">
                      {formatDateTimeID(c.verified_at)}
                    </p>
                    {c.confidence_score !== null &&
                      c.confidence_score !== undefined && (
                        <p className="text-[11px] text-emerald-700">
                          Akurasi {Math.round(c.confidence_score * 100)}%
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
        {room.status !== "AVAILABLE" ? (
          confirmRelease ? (
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <span className="text-xs font-medium text-rose-700">
                Kosongkan {room.room_code} sekarang?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRelease(false)}
                  disabled={releasing}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRelease}
                  disabled={releasing}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {releasing ? "Memproses..." : "Ya, Kosongkan"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmRelease(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <IconUnlock className="w-4 h-4" />
                {room.status === "LOCKED"
                  ? "Batalkan Kunci"
                  : "Selesai / Kosongkan Ruang"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
            </>
          )
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );
}

export default function ActionModal({
  mode = "lock", // "lock" | "detail"
  room,
  nowMs = null,
  savedToken = null,
  todaySchedules = [],
  initialCourse = "",
  initialClass = "",
  demoMode = false,
  demoCheckins = [],
  onClose,
  onLockSubmit,
  onRelease,
  onSwitchToLock,
}) {
  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      {mode === "lock" ? (
        <LockModalView
          room={room}
          todaySchedules={todaySchedules}
          initialCourse={initialCourse}
          initialClass={initialClass}
          onClose={onClose}
          onLockSubmit={onLockSubmit}
        />
      ) : (
        <DetailModalView
          room={room}
          nowMs={nowMs}
          savedToken={savedToken}
          todaySchedules={todaySchedules}
          demoMode={demoMode}
          demoCheckins={demoCheckins}
          onClose={onClose}
          onRelease={onRelease}
          onSwitchToLock={onSwitchToLock}
        />
      )}
    </div>
  );
}
