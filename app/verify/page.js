"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  IconCamera,
  IconUpload,
  IconCheckCircle,
  IconAlert,
  IconArrowRight,
  IconClock,
} from "@/components/Icons";
import { loadDemoState, saveDemoState } from "@/lib/roomsData";

function isDemoTokenMatch(expectedRoomCode, ocrRawText) {
  if (!expectedRoomCode || !ocrRawText) return false;
  const expectedAlnum = expectedRoomCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const expectedDigits = expectedRoomCode.replace(/\D/g, "");
  const cleanedOcr = ocrRawText.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const digitNormalizedOcr = cleanedOcr.replace(/O/g, "0").replace(/[IL]/g, "1");

  if (cleanedOcr.includes(expectedAlnum)) return true;
  if (expectedDigits && cleanedOcr.includes(expectedDigits)) return true;
  if (expectedDigits && digitNormalizedOcr.includes(expectedDigits)) return true;
  return false;
}

async function runBrowserOcr(imageDataUrl, onProgress) {
  // 1. Try native Chromium TextDetector API if available
  if (typeof window !== "undefined" && "TextDetector" in window) {
    try {
      onProgress("Mendeteksi teks dengan OCR browser...");
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const detector = new window.TextDetector();
      const blocks = await detector.detect(img);
      const text = blocks
        .map((b) => b.rawValue)
        .join(" ")
        .trim();
      if (text) {
        return { text, confidence: 0.9 };
      }
    } catch {
      // fall through to Tesseract CDN
    }
  }

  // 2. Try Tesseract.js loaded on-demand from jsDelivr CDN
  if (typeof window !== "undefined") {
    try {
      onProgress("Memuat mesin OCR (Tesseract)...");
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      if (window.Tesseract) {
        onProgress("Membaca kode ruangan dari foto plakat...");
        const result = await window.Tesseract.recognize(imageDataUrl, "eng");
        const text = (result?.data?.text || "").replace(/\s+/g, " ").trim();
        const confidence =
          typeof result?.data?.confidence === "number"
            ? Math.min(1, Math.max(0, result.data.confidence / 100))
            : 0.85;
        return { text, confidence };
      }
    } catch {
      // offline or blocked CDN
    }
  }

  return null;
}

function VerifyCheckinContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [magicToken, setMagicToken] = useState(initialToken);
  const [verifiedBy, setVerifiedBy] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [confidenceScore, setConfidenceScore] = useState(0.92);

  const [previewUrl, setPreviewUrl] = useState("");
  const [ocrStatus, setOcrStatus] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const [demoLockedRooms, setDemoLockedRooms] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const demo = loadDemoState();
      const locked = (demo.rooms || []).filter((r) => r.status === "LOCKED");
      setDemoLockedRooms(locked);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function processImageDataUrl(dataUrl) {
    setPreviewUrl(dataUrl);
    setOcrStatus("Menganalisis gambar plakat...");
    const result = await runBrowserOcr(dataUrl, setOcrStatus);
    if (result && result.text) {
      setOcrText(result.text);
      setConfidenceScore(Number(result.confidence.toFixed(2)));
      setOcrStatus(
        `Teks terdeteksi (${Math.round(result.confidence * 100)}%). Periksa sebelum mengirim.`
      );
    } else {
      setOcrStatus(
        "OCR otomatis tidak tersedia/tidak terbaca. Silakan ketik kode ruang yang terlihat di foto."
      );
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        processImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setCameraError(
        "Kamera tidak dapat diakses. Gunakan tombol Unggah Foto Plakat di bawah."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    processImageDataUrl(dataUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    const token = magicToken.trim();
    const rawText = ocrText.trim();

    if (!token) {
      setSubmitError("Token verifikasi wajib diisi.");
      return;
    }
    if (!rawText) {
      setSubmitError(
        "Hasil pembacaan teks plakat pintu (OCR) wajib diisi atau difoto terlebih dahulu."
      );
      return;
    }

    setSubmitting(true);
    try {
      // Check if token belongs to Demo Mode local state
      if (token.startsWith("demo-")) {
        const demo = loadDemoState();
        const room = demo.rooms.find(
          (r) => r.magic_token === token && r.status === "LOCKED"
        );
        if (!room) {
          throw new Error(
            "Token simulasi tidak valid, sudah dipakai, atau ruangan tidak sedang dikunci."
          );
        }
        if (room.locked_until && new Date(room.locked_until) < new Date()) {
          throw new Error(
            "Waktu verifikasi 15 menit sudah habis. Silakan kunci ulang ruangan."
          );
        }
        if (!isDemoTokenMatch(room.room_code, rawText)) {
          throw new Error(
            `Kode ruangan ${room.room_code} tidak terdeteksi di foto. Silakan foto ulang plakat pintu.`
          );
        }

        const verifier = verifiedBy.trim() || room.locked_by || "Mahasiswa FST";
        const updatedRoom = {
          ...room,
          status: "OCCUPIED",
          locked_until: null,
          magic_token: null,
        };
        const checkin = {
          id: Date.now(),
          room_code: room.room_code,
          verified_by: verifier,
          ocr_raw_text: rawText,
          confidence_score: confidenceScore,
          verified_at: new Date().toISOString(),
        };
        saveDemoState({
          ...demo,
          rooms: demo.rooms.map((r) => (r.id === room.id ? updatedRoom : r)),
          checkins: [checkin, ...(demo.checkins || [])],
        });
        setVerifyResult({
          message: `Check-in ruangan ${room.room_code} berhasil! (Mode Simulasi)`,
          room: updatedRoom,
          checkin,
        });
        return;
      }

      const res = await fetch("/api/verify-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          magic_token: token,
          ocr_raw_text: rawText,
          confidence_score: confidenceScore,
          verified_by: verifiedBy.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memverifikasi check-in.");
      }
      setVerifyResult(data);
    } catch (err) {
      setSubmitError(err.message || "Terjadi kesalahan saat verifikasi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar subtitle="Verifikasi Check-in Plakat Pintu" actionType="back" />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-8">
        {verifyResult ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <IconCheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900">
                {verifyResult.message}
              </h1>
              <p className="text-sm text-slate-500">
                Status ruangan kini tercatat sebagai{" "}
                <strong className="text-slate-800">Sedang Dipakai</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Ruangan</span>
                <span className="font-mono font-bold text-slate-900">
                  {verifyResult.room?.room_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mata Kuliah</span>
                <span className="font-medium text-slate-900">
                  {verifyResult.room?.current_course} (
                  {verifyResult.room?.current_class})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diverifikasi oleh</span>
                <span className="font-medium text-slate-900">
                  {verifyResult.checkin?.verified_by}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Teks OCR</span>
                <span className="font-mono text-xs text-slate-700">
                  {verifyResult.checkin?.ocr_raw_text}
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Kembali ke Status Ruangan
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <h1 className="text-lg font-bold text-slate-900">
                Verifikasi Kehadiran di Ruangan
              </h1>
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                <IconClock className="w-3.5 h-3.5 text-amber-600" />
                Foto plakat kode pintu ruangan untuk mengubah status kunci
                menjadi terpakai.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {submitError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                  <IconAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Token Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Magic Token Verifikasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={magicToken}
                  onChange={(e) => setMagicToken(e.target.value)}
                  placeholder="Tempel token dari link /verify?token=..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                {!initialToken && demoLockedRooms.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">
                      Token simulasi aktif:
                    </span>
                    {demoLockedRooms.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setMagicToken(r.magic_token)}
                        className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                      >
                        {r.room_code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Photo / Camera Capture */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Foto Plakat Pintu Ruangan
                </label>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={cameraOpen ? stopCamera : startCamera}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <IconCamera className="w-4 h-4" />
                    {cameraOpen ? "Tutup Kamera" : "Buka Kamera"}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <IconUpload className="w-4 h-4" />
                    Unggah / Ambil Foto
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {cameraError && (
                  <p className="text-xs text-rose-600">{cameraError}</p>
                )}

                {cameraOpen && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black space-y-2 p-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-h-72 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Ambil Foto Plakat
                    </button>
                  </div>
                )}

                {previewUrl && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Pratinjau foto plakat pintu"
                      className="max-h-56 w-full object-contain rounded-xl bg-white"
                    />
                    {ocrStatus && (
                      <p className="text-xs text-slate-600">{ocrStatus}</p>
                    )}
                  </div>
                )}
              </div>

              {/* OCR Text Output / Confirmation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Teks Kode Ruang Terdeteksi (OCR){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Confidence: {Math.round(confidenceScore * 100)}%
                  </span>
                </div>
                <input
                  type="text"
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="Contoh: FST-201 (otomatis terisi dari foto atau ketik manual)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* Verifier Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Verifikator (Opsional)
                </label>
                <input
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  placeholder="Kosongkan untuk memakai nama pengunci awal"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-xs"
              >
                <IconCheckCircle className="w-4 h-4" />
                {submitting
                  ? "Memverifikasi Check-in..."
                  : "Konfirmasi & Check-in Ruangan"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
          Memuat halaman verifikasi...
        </div>
      }
    >
      <VerifyCheckinContent />
    </Suspense>
  );
}
