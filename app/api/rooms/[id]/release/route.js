import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const roomId = Number(id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return NextResponse.json({ error: 'ID ruangan tidak valid.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: updatedRoom, error } = await supabase
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
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!updatedRoom) {
      return NextResponse.json({ error: 'Ruangan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: `Ruangan ${updatedRoom.room_code} berhasil dikosongkan.`,
        room: updatedRoom,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/rooms/[id]/release error:', error);
    return NextResponse.json(
      { error: 'Gagal mengosongkan ruangan.' },
      { status: 500 }
    );
  }
}