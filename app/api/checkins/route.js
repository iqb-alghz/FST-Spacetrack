import { NextResponse, connection } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  try {
    await connection();

    const { searchParams } = new URL(request.url);
    const roomCode = (searchParams.get('room_code') || '').trim().toUpperCase();
    const rawLimit = Number(searchParams.get('limit') || 20);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('checkins')
      .select('*')
      .order('verified_at', { ascending: false })
      .limit(limit);

    if (roomCode) {
      query = query.eq('room_code', roomCode);
    }

    const { data: checkins, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { checkins },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('GET /api/checkins error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil riwayat check-in.' },
      { status: 500 }
    );
  }
}