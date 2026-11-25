import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function isRoomCodeMatched(expectedRoomCode, ocrRawText) {
  if (!expectedRoomCode || !ocrRawText) return false;

  const expectedAlnum = expectedRoomCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const expectedDigits = expectedRoomCode.replace(/\D/g, '');

  const cleanedOcr = ocrRawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const digitNormalizedOcr = cleanedOcr
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');

  if (cleanedOcr.includes(expectedAlnum)) return true;
  if (expectedDigits && cleanedOcr.includes(expectedDigits)) return true;
  if (expectedDigits && digitNormalizedOcr.includes(expectedDigits)) return true;

  return false;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const magicToken = (body.magic_token || '').trim();
    const ocrRawText = (body.ocr_raw_text || '').trim();
    const confidenceScore =
      body.confidence_score !== undefined && body.confidence_score !== null
        ? Number(body.confidence_score)
        : null;
    const verifiedByInput = (body.verified_by || '').trim();

    if (!magicToken || !ocrRawText) {
      return NextResponse.json(
        { error: 'magic_token dan ocr_raw_text wajib dikirim.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: room, error: findError } = await supabase
      .from('rooms')
      .select('*')
      .eq('magic_token', magicToken)
      .eq('status', 'LOCKED')
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!room) {
      return NextResponse.json(
        { error: 'Token tidak valid, sudah dipakai, atau ruangan tidak sedang dikunci.' },
        { status: 404 }
      );
    }

    if (room.locked_until && new Date(room.locked_until) < new Date()) {
      await supabase
        .from('rooms')
        .update({
          status: 'AVAILABLE',
          current_course: null,
          current_class: null,
          locked_by: null,
          locked_until: null,
          magic_token: null,
        })
        .eq('id', room.id)
        .eq('magic_token', magicToken);

      return NextResponse.json(
        { error: 'Waktu verifikasi 15 menit sudah habis. Silakan kunci ulang ruangan.' },
        { status: 410 }
      );
    }

    if (!isRoomCodeMatched(room.room_code, ocrRawText)) {
      return NextResponse.json(
        {
          error: `Kode ruangan ${room.room_code} tidak terdeteksi di foto. Silakan foto ulang plakat pintu.`,
        },
        { status: 422 }
      );
    }

    const verifiedBy = verifiedByInput || room.locked_by || 'Mahasiswa FST';

    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update({
        status: 'OCCUPIED',
        locked_until: null,
        magic_token: null,
      })
      .eq('id', room.id)
      .eq('magic_token', magicToken)
      .eq('status', 'LOCKED')
      .select()
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updatedRoom) {
      return NextResponse.json(
        { error: 'Token sudah pernah digunakan.' },
        { status: 409 }
      );
    }

    const { data: checkin, error: checkinError } = await supabase
      .from('checkins')
      .insert({
        room_code: room.room_code,
        verified_by: verifiedBy,
        ocr_raw_text: ocrRawText,
        confidence_score: Number.isFinite(confidenceScore) ? confidenceScore : null,
      })
      .select()
      .single();

    if (checkinError) {
      throw checkinError;
    }

    return NextResponse.json(
      {
        message: `Check-in ruangan ${room.room_code} berhasil!`,
        room: updatedRoom,
        checkin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/verify-checkin error:', error);
    return NextResponse.json(
      { error: 'Gagal memverifikasi check-in.' },
      { status: 500 }
    );
  }
}