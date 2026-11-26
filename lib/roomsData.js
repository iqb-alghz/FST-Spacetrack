export const ROOM_STATUS_META = {
  AVAILABLE: {
    label: "Tersedia",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dotClass: "bg-emerald-500",
    accentBorder: "border-t-emerald-500",
  },
  LOCKED: {
    label: "Menunggu Check-in",
    badgeClass:
      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
    dotClass: "bg-amber-500 animate-pulse",
    accentBorder: "border-t-amber-500",
  },
  OCCUPIED: {
    label: "Sedang Dipakai",
    badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    dotClass: "bg-rose-500",
    accentBorder: "border-t-rose-500",
  },
};

export const DAYS_OF_WEEK = [
  { key: "Monday", label: "Senin" },
  { key: "Tuesday", label: "Selasa" },
  { key: "Wednesday", label: "Rabu" },
  { key: "Thursday", label: "Kamis" },
  { key: "Friday", label: "Jumat" },
  { key: "Saturday", label: "Sabtu" },
];

export const TOKEN_STORAGE_KEY = "fst_spacetrack_lock_tokens_v1";
const DEMO_STORAGE_KEY = "fst_spacetrack_demo_state_v1";

export function getTodayDayKey() {
  const idx = new Date().getDay();
  const map = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return map[idx] === "Sunday" ? "Monday" : map[idx];
}

export function formatRemainingTime(lockedUntilIso, nowMs = Date.now()) {
  if (!lockedUntilIso || nowMs === null || nowMs === undefined) return null;
  const targetMs = new Date(lockedUntilIso).getTime();
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return {
    totalSeconds: diffSec,
    formatted: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    isUrgent: diffSec > 0 && diffSec <= 180,
    expired: diffSec <= 0,
  };
}

export function formatTimeShort(timeStr) {
  if (!timeStr) return "-";
  return String(timeStr).slice(0, 5);
}

export function formatDateTimeID(isoStr) {
  if (!isoStr) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoStr));
  } catch {
    return isoStr;
  }
}

export function getScheduleCourse(schedule) {
  return (
    schedule?.course_name ||
    schedule?.course ||
    schedule?.subject ||
    "Mata Kuliah"
  );
}

export function getScheduleClass(schedule) {
  return schedule?.class_name || schedule?.class || schedule?.kelas || "-";
}

export function getScheduleLecturer(schedule) {
  return schedule?.lecturer || schedule?.instructor || schedule?.dosen || null;
}

export function loadSavedTokens() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(TOKEN_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function persistSavedToken(roomId, token) {
  if (typeof window === "undefined" || !token) return;
  try {
    const current = loadSavedTokens();
    current[String(roomId)] = token;
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

export function getInitialDemoState() {
  const now = Date.now();
  return {
    rooms: [
      {
        id: 1,
        room_code: "FST-101",
        room_name: "Ruang Teori 101",
        floor: 1,
        capacity: 45,
        status: "AVAILABLE",
        current_course: null,
        current_class: null,
        locked_by: null,
        locked_until: null,
        magic_token: null,
      },
      {
        id: 2,
        room_code: "FST-102",
        room_name: "Lab Komputer Dasar",
        floor: 1,
        capacity: 40,
        status: "OCCUPIED",
        current_course: "Algoritma & Pemrograman",
        current_class: "TI-1A",
        locked_by: "Raka Pratama (PJ)",
        locked_until: null,
        magic_token: null,
      },
      {
        id: 3,
        room_code: "FST-201",
        room_name: "Ruang Seminar FST",
        floor: 2,
        capacity: 60,
        status: "LOCKED",
        current_course: "Struktur Data",
        current_class: "SI-2B",
        locked_by: "Nadia Kusuma",
        locked_until: new Date(now + 11 * 60 * 1000).toISOString(),
        magic_token: "demo-token-fst-201",
      },
      {
        id: 4,
        room_code: "FST-204",
        room_name: "Ruang Teori 204",
        floor: 2,
        capacity: 40,
        status: "AVAILABLE",
        current_course: null,
        current_class: null,
        locked_by: null,
        locked_until: null,
        magic_token: null,
      },
      {
        id: 5,
        room_code: "FST-301",
        room_name: "Lab Rekayasa Perangkat Lunak",
        floor: 3,
        capacity: 36,
        status: "OCCUPIED",
        current_course: "Rekayasa Web Modern",
        current_class: "TI-5A",
        locked_by: "Dr. Hendra Wijaya",
        locked_until: null,
        magic_token: null,
      },
      {
        id: 6,
        room_code: "FST-302",
        room_name: "Ruang Teori 302",
        floor: 3,
        capacity: 45,
        status: "AVAILABLE",
        current_course: null,
        current_class: null,
        locked_by: null,
        locked_until: null,
        magic_token: null,
      },
      {
        id: 7,
        room_code: "FST-401",
        room_name: "Lab Sains Data & AI",
        floor: 4,
        capacity: 32,
        status: "AVAILABLE",
        current_course: null,
        current_class: null,
        locked_by: null,
        locked_until: null,
        magic_token: null,
      },
      {
        id: 8,
        room_code: "FST-403",
        room_name: "Ruang Diskusi Riset",
        floor: 4,
        capacity: 28,
        status: "AVAILABLE",
        current_course: null,
        current_class: null,
        locked_by: null,
        locked_until: null,
        magic_token: null,
      },
    ],
    schedules: [
      {
        id: 1,
        room_code: "FST-101",
        day_of_week: getTodayDayKey(),
        start_time: "08:00:00",
        end_time: "09:40:00",
        course_name: "Kalkulus Lanjut",
        class_name: "MTK-2A",
        lecturer: "Prof. Ratna Dewi",
      },
      {
        id: 2,
        room_code: "FST-102",
        day_of_week: getTodayDayKey(),
        start_time: "09:45:00",
        end_time: "11:25:00",
        course_name: "Algoritma & Pemrograman",
        class_name: "TI-1A",
        lecturer: "Budi Santoso, M.Kom.",
      },
      {
        id: 3,
        room_code: "FST-201",
        day_of_week: getTodayDayKey(),
        start_time: "13:00:00",
        end_time: "14:40:00",
        course_name: "Struktur Data",
        class_name: "SI-2B",
        lecturer: "Siti Aminah, M.T.",
      },
      {
        id: 4,
        room_code: "FST-301",
        day_of_week: getTodayDayKey(),
        start_time: "10:00:00",
        end_time: "12:30:00",
        course_name: "Rekayasa Web Modern",
        class_name: "TI-5A",
        lecturer: "Dr. Hendra Wijaya",
      },
      {
        id: 5,
        room_code: "FST-302",
        day_of_week: getTodayDayKey(),
        start_time: "15:00:00",
        end_time: "16:40:00",
        course_name: "Basis Data Terdistribusi",
        class_name: "TI-4B",
        lecturer: "Fajar Nugroho, M.Cs.",
      },
    ],
    checkins: [
      {
        id: 101,
        room_code: "FST-301",
        verified_by: "Dr. Hendra Wijaya",
        ocr_raw_text: "LAB RPL FST-301 LT 3",
        confidence_score: 0.96,
        verified_at: new Date(now - 35 * 60 * 1000).toISOString(),
      },
      {
        id: 102,
        room_code: "FST-102",
        verified_by: "Raka Pratama (PJ)",
        ocr_raw_text: "RUANG FST 102",
        confidence_score: 0.91,
        verified_at: new Date(now - 75 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export function loadDemoState() {
  if (typeof window === "undefined") return getInitialDemoState();
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDemoState();
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialDemoState();
  }
}

export function saveDemoState(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}
