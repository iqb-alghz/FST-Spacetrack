"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import KpiSummary from "@/components/KpiSummary";
import RoomCard from "@/components/RoomCard";
import ActionModal from "@/components/ActionModal";
import SchedulePanel from "@/components/SchedulePanel";
import CheckinHistoryPanel from "@/components/CheckinHistoryPanel";
import {
  IconDoor,
  IconSearch,
  IconCalendar,
  IconHistory,
  IconAlert,
  IconCheckCircle,
} from "@/components/Icons";
import {
  getTodayDayKey,
  getScheduleCourse,
  getScheduleClass,
  loadSavedTokens,
  persistSavedToken,
  loadDemoState,
  saveDemoState,
  getInitialDemoState,
} from "@/lib/roomsData";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("rooms"); // "rooms" | "schedules" | "checkins"
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [checkins, setCheckins] = useState([]);

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingCheckins, setLoadingCheckins] = useState(false);

  const [apiError, setApiError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nowMs, setNowMs] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [scheduleDay, setScheduleDay] = useState("Monday");
  const [scheduleRoomCode, setScheduleRoomCode] = useState("");
  const [checkinRoomCode, setCheckinRoomCode] = useState("");

  // Modal state ({ mode: "lock" | "detail", room, initialCourse?, initialClass? })
  const [modalState, setModalState] = useState(null);
  const [savedTokens, setSavedTokens] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setSavedTokens(loadSavedTokens());
      setScheduleDay(getTodayDayKey());
      setNowMs(Date.now());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? "" : prev));
    }, 4000);
  }, []);

  const fetchRoomsAndTodaySchedules = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoadingRooms(true);
      try {
        if (demoMode) {
          const demo = loadDemoState();
          const nowIso = new Date().toISOString();
          let changed = false;
          const updatedRooms = demo.rooms.map((r) => {
            if (r.status === "LOCKED" && r.locked_until && r.locked_until < nowIso) {
              changed = true;
              return {
                ...r,
                status: "AVAILABLE",
                current_course: null,
                current_class: null,
                locked_by: null,
                locked_until: null,
                magic_token: null,
              };
            }
            return r;
          });
          if (changed) {
            saveDemoState({ ...demo, rooms: updatedRooms });
          }
          setRooms(updatedRooms);
          setTodaySchedules(
            demo.schedules.filter((s) => s.day_of_week === getTodayDayKey())
          );
          setApiError("");
          setLastUpdated(new Date());
          return;
        }

        const todayKey = getTodayDayKey();
        const [roomsRes, schRes] = await Promise.all([
          fetch("/api/rooms", { cache: "no-store" }),
          fetch(`/api/schedules?day=${encodeURIComponent(todayKey)}`, {
            cache: "no-store",
          }),
        ]);

        const roomsData = await roomsRes.json();
        if (!roomsRes.ok) {
          throw new Error(roomsData.error || "Gagal mengambil data ruangan.");
        }

        setRooms(roomsData.rooms || []);
        if (schRes.ok) {
          const schData = await schRes.json();
          setTodaySchedules(schData.schedules || []);
        }
        setApiError("");
        setLastUpdated(new Date());
      } catch (err) {
        setApiError(err.message || "Gagal terhubung ke server.");
      } finally {
        if (!silent) setLoadingRooms(false);
      }
    },
    [demoMode]
  );

  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      if (demoMode) {
        const demo = loadDemoState();
        const filtered = scheduleDay
          ? demo.schedules.filter((s) => s.day_of_week === scheduleDay)
          : demo.schedules;
        setSchedules(filtered);
        return;
      }

      const params = new URLSearchParams();
      if (scheduleDay) params.set("day", scheduleDay);
      if (scheduleRoomCode) params.set("room_code", scheduleRoomCode);

      const res = await fetch(`/api/schedules?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil jadwal.");
      setSchedules(data.schedules || []);
    } catch {
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, [demoMode, scheduleDay, scheduleRoomCode]);

  const fetchCheckins = useCallback(async () => {
    setLoadingCheckins(true);
    try {
      if (demoMode) {
        const demo = loadDemoState();
        const filtered = checkinRoomCode
          ? demo.checkins.filter(
              (c) => c.room_code?.toUpperCase() === checkinRoomCode.toUpperCase()
            )
          : demo.checkins;
        setCheckins(filtered);
        return;
      }

      const params = new URLSearchParams({ limit: "30" });
      if (checkinRoomCode) params.set("room_code", checkinRoomCode);

      const res = await fetch(`/api/checkins?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil riwayat.");
      setCheckins(data.checkins || []);
    } catch {
      setCheckins([]);
    } finally {
      setLoadingCheckins(false);
    }
  }, [demoMode, checkinRoomCode]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchRoomsAndTodaySchedules();
    });
    const poll = setInterval(() => {
      fetchRoomsAndTodaySchedules({ silent: true });
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [fetchRoomsAndTodaySchedules]);

  useEffect(() => {
    if (activeTab !== "schedules") return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchSchedules();
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchSchedules]);

  useEffect(() => {
    if (activeTab !== "checkins") return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchCheckins();
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchCheckins]);

  const hasLockedRoom = rooms.some((r) => r.status === "LOCKED");
  useEffect(() => {
    if (!hasLockedRoom) return;
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [hasLockedRoom]);

  async function handleLockSubmit(roomId, payload) {
    if (demoMode) {
      const demo = loadDemoState();
      const target = demo.rooms.find((r) => r.id === roomId);
      if (!target || target.status !== "AVAILABLE") {
        throw new Error("Ruangan sedang tidak tersedia.");
      }
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const magicToken = `demo-${target.room_code.toLowerCase()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const updatedRoom = {
        ...target,
        status: "LOCKED",
        current_course: payload.current_course,
        current_class: payload.current_class,
        locked_by: payload.locked_by,
        locked_until: lockedUntil,
        magic_token: magicToken,
      };
      const nextRooms = demo.rooms.map((r) =>
        r.id === roomId ? updatedRoom : r
      );
      saveDemoState({ ...demo, rooms: nextRooms });
      setRooms(nextRooms);
      persistSavedToken(roomId, magicToken);
      setSavedTokens(loadSavedTokens());
      showToast(`${updatedRoom.room_code} berhasil dikunci selama 15 menit.`);
      return {
        room: updatedRoom,
        magic_token: magicToken,
        verify_url: `/verify?token=${magicToken}`,
        locked_until: lockedUntil,
      };
    }

    const res = await fetch(`/api/rooms/${roomId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gagal mengunci ruangan.");
    }

    persistSavedToken(roomId, data.magic_token);
    setSavedTokens(loadSavedTokens());
    await fetchRoomsAndTodaySchedules({ silent: true });
    showToast(`${data.room?.room_code || "Ruangan"} berhasil dikunci 15 menit.`);
    return data;
  }

  async function handleReleaseRoom(roomId) {
    if (demoMode) {
      const demo = loadDemoState();
      const nextRooms = demo.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: "AVAILABLE",
              current_course: null,
              current_class: null,
              locked_by: null,
              locked_until: null,
              magic_token: null,
            }
          : r
      );
      saveDemoState({ ...demo, rooms: nextRooms });
      setRooms(nextRooms);
      showToast("Ruangan berhasil dikosongkan.");
      return;
    }

    const res = await fetch(`/api/rooms/${roomId}/release`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gagal mengosongkan ruangan.");
    }
    await fetchRoomsAndTodaySchedules({ silent: true });
    showToast(data.message || "Ruangan berhasil dikosongkan.");
  }

  function activateDemoMode() {
    const existing = loadDemoState();
    if (!existing.rooms?.length) {
      saveDemoState(getInitialDemoState());
    }
    setDemoMode(true);
    setApiError("");
    showToast("Mode Simulasi UI aktif. Data disimpan di browser lokal.");
  }

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter((r) => r.status === "AVAILABLE").length,
      locked: rooms.filter((r) => r.status === "LOCKED").length,
      occupied: rooms.filter((r) => r.status === "OCCUPIED").length,
    };
  }, [rooms]);

  const floors = useMemo(() => {
    return Array.from(
      new Set(
        rooms.map((r) => r.floor).filter((f) => f !== null && f !== undefined)
      )
    ).sort((a, b) => Number(a) - Number(b));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rooms.filter((room) => {
      if (selectedFloor !== "ALL" && String(room.floor) !== String(selectedFloor)) {
        return false;
      }
      if (selectedStatus !== "ALL" && room.status !== selectedStatus) {
        return false;
      }
      if (q) {
        const haystack = [
          room.room_code,
          room.room_name,
          room.current_course,
          room.current_class,
          room.locked_by,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rooms, selectedFloor, selectedStatus, searchQuery]);

  const todayScheduleByRoom = useMemo(() => {
    const map = new Map();
    for (const sch of todaySchedules) {
      const key = sch.room_code?.toUpperCase();
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(sch);
    }
    return map;
  }, [todaySchedules]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        demoMode={demoMode}
        lastUpdated={lastUpdated}
        loading={loadingRooms}
        onRefresh={() => fetchRoomsAndTodaySchedules()}
        actionType="verify"
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {toastMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-xs">
            <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {apiError && !demoMode && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <IconAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-950">
                  Koneksi database Supabase belum aktif
                </p>
                <p className="text-xs text-amber-800">
                  {apiError} Pastikan{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{" "}
                  dan{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
                    SUPABASE_SERVICE_ROLE_KEY
                  </code>{" "}
                  sudah diisi di{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
                    .env.local
                  </code>
                  , atau coba tampilan secara interaktif dengan data simulasi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={activateDemoMode}
              className="shrink-0 rounded-xl bg-amber-900 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-950 transition-colors"
            >
              Aktifkan Mode Simulasi UI
            </button>
          </div>
        )}

        <KpiSummary
          stats={stats}
          floorCount={floors.length}
          activeTab={activeTab}
          selectedStatus={selectedStatus}
          onSelectStatus={(status) => {
            setActiveTab("rooms");
            setSelectedStatus(status);
          }}
        />

        {/* Workspace Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
          <nav className="flex items-center gap-1 -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab("rooms")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === "rooms"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <IconDoor className="w-4 h-4" />
              Status Ruangan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schedules")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === "schedules"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <IconCalendar className="w-4 h-4" />
              Jadwal Kuliah
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("checkins")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === "checkins"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <IconHistory className="w-4 h-4" />
              Riwayat Check-in
            </button>
          </nav>

          {demoMode && (
            <button
              type="button"
              onClick={() => {
                setDemoMode(false);
                fetchRoomsAndTodaySchedules();
              }}
              className="mb-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Coba hubungkan ulang ke API Supabase
            </button>
          )}
        </div>

        {/* Tab 1: Rooms */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode ruang, mata kuliah, kelas, atau nama PJ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFloor("ALL")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      selectedFloor === "ALL"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Semua Lantai
                  </button>
                  {floors.map((floor) => (
                    <button
                      key={floor}
                      type="button"
                      onClick={() => setSelectedFloor(String(floor))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        String(selectedFloor) === String(floor)
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Lt. {floor}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="AVAILABLE">Tersedia</option>
                  <option value="LOCKED">Menunggu Check-in</option>
                  <option value="OCCUPIED">Sedang Dipakai</option>
                </select>
              </div>
            </div>

            {loadingRooms && rooms.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-52 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-4"
                  >
                    <div className="flex justify-between">
                      <div className="h-6 w-24 rounded-lg bg-slate-200" />
                      <div className="h-5 w-20 rounded-full bg-slate-100" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-4 w-3/4 rounded bg-slate-100" />
                      <div className="h-4 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  Tidak ada ruangan yang cocok dengan filter
                </p>
                <p className="text-xs text-slate-500">
                  Coba ubah kata kunci pencarian, filter lantai, atau status.
                </p>
                {(searchQuery ||
                  selectedFloor !== "ALL" ||
                  selectedStatus !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedFloor("ALL");
                      setSelectedStatus("ALL");
                    }}
                    className="mt-2 inline-flex rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRooms.map((room) => {
                  const roomSchedules =
                    todayScheduleByRoom.get(room.room_code?.toUpperCase()) || [];
                  const verifyToken =
                    room.magic_token || savedTokens[String(room.id)] || null;

                  return (
                    <RoomCard
                      key={room.id}
                      room={room}
                      nowMs={nowMs}
                      nextSchedule={roomSchedules[0] || null}
                      verifyToken={verifyToken}
                      onLockClick={(targetRoom) =>
                        setModalState({
                          mode: "lock",
                          room: targetRoom,
                          initialCourse: "",
                          initialClass: "",
                        })
                      }
                      onDetailClick={(targetRoom) =>
                        setModalState({
                          mode: "detail",
                          room: targetRoom,
                        })
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Schedules */}
        {activeTab === "schedules" && (
          <SchedulePanel
            schedules={schedules}
            rooms={rooms}
            selectedDay={scheduleDay}
            onSelectDay={setScheduleDay}
            selectedRoomCode={scheduleRoomCode}
            onSelectRoomCode={setScheduleRoomCode}
            loading={loadingSchedules}
            onQuickLockFromSchedule={(room, sch) => {
              setModalState({
                mode: "lock",
                room,
                initialCourse: getScheduleCourse(sch),
                initialClass: getScheduleClass(sch),
              });
            }}
          />
        )}

        {/* Tab 3: Check-in History */}
        {activeTab === "checkins" && (
          <CheckinHistoryPanel
            checkins={checkins}
            rooms={rooms}
            selectedRoomCode={checkinRoomCode}
            onSelectRoomCode={setCheckinRoomCode}
            loading={loadingCheckins}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>FST-Spacetrack • Sistem Manajemen & Check-in Ruang Kuliah</p>
          <p>Penguncian otomatis berakhir dalam 15 menit tanpa verifikasi OCR</p>
        </div>
      </footer>

      {modalState?.room && (
        <ActionModal
          key={`${modalState.mode}-${modalState.room.id}-${modalState.initialCourse || ""}-${modalState.initialClass || ""}`}
          mode={modalState.mode}
          room={modalState.room}
          nowMs={nowMs}
          savedToken={savedTokens[String(modalState.room.id)] || null}
          todaySchedules={todaySchedules}
          initialCourse={modalState.initialCourse || ""}
          initialClass={modalState.initialClass || ""}
          demoMode={demoMode}
          demoCheckins={demoMode ? loadDemoState().checkins : []}
          onClose={() => setModalState(null)}
          onLockSubmit={handleLockSubmit}
          onRelease={handleReleaseRoom}
          onSwitchToLock={(targetRoom) =>
            setModalState({
              mode: "lock",
              room: targetRoom,
              initialCourse: "",
              initialClass: "",
            })
          }
        />
      )}
    </div>
  );
}
