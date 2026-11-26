import { NextResponse, connection } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  await connection();

  try {
    const supabase = getSupabaseAdmin();
    // ... sisa kode di dalam try tetap sama
    const nowIso = new Date().toISOString();

    const { error: cleanupError } = await supabase
      .from('rooms')
      .update({
        status: 'AVAILABLE',
        current_course: null,
        current_class: null,
        locked_by: null,
        locked_until: null,
        magic_token: null,
      })
      .eq('status', 'LOCKED')
      .lt('locked_until', nowIso);

    if (cleanupError) {
      throw cleanupError;
    }

    const { data: rooms, error: fetchError } = await supabase
      .from('rooms')
      .select('*')
      .order('floor', { ascending: true })
      .order('room_code', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json(
      { rooms },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('GET /api/rooms error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data ruangan.' },
      { status: 500 }
    );
  }
}