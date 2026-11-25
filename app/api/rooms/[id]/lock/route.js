import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const roomId = Number(id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return NextResponse.json({ error: 'ID ruangan tidak valid.' }, { status: 400 });
    }

    const body = await request.json();
    const currentCourse = (body.current_course || body.course_name || '').trim();
    const currentClass = (body.current_class || body.class_name || '').trim();
    const lockedBy = (body.locked_by || '').trim();

    if (!currentCourse || !currentClass || !lockedBy) {
      return NextResponse.json(
        { error: 'Mata kuliah, kelas, dan nama pengunci wajib diisi.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const now = new Date();
    const nowIso = now.toISOString();

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
      .eq('id', roomId)
      .eq('status', 'LOCKED')
      .lt('locked_until', nowIso);

    const lockedUntil = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const magicToken = crypto.randomUUID();

    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update({
        status: 'LOCKED',
        current_course: currentCourse,
        current_class: currentClass,
        locked_by: lockedBy,
        locked_until: lockedUntil,
        magic_token: magicToken,
      })
      .eq('id', roomId)
      .eq('status', 'AVAILABLE')
      .select()
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updatedRoom) {
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('id', roomId)
        .maybeSingle();

      if (!existingRoom) {
        return NextResponse.json({ error: 'Ruangan tidak ditemukan.' }, { status: 404 });
      }

      return NextResponse.json(
        { error: `Ruangan sedang tidak tersedia (status: ${existingRoom.status}).` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        room: updatedRoom,
        magic_token: magicToken,
        verify_url: `/verify?token=${magicToken}`,
        locked_until: lockedUntil,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/rooms/[id]/lock error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunci ruangan.' },
      { status: 500 }
    );
  }
}