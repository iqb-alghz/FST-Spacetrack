import { NextResponse, connection } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const DAY_MAP = {
  senin: 'Monday',
  selasa: 'Tuesday',
  rabu: 'Wednesday',
  kamis: 'Thursday',
  jumat: 'Friday',
  sabtu: 'Saturday',
  minggu: 'Sunday',
};

export async function GET(request) {
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const rawDay = (searchParams.get('day') || '').trim();
    const roomCode = (searchParams.get('room_code') || '').trim().toUpperCase();

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('schedules')
      .select('*')
      .order('start_time', { ascending: true })
      .order('room_code', { ascending: true });

    if (rawDay) {
      const normalizedDay = DAY_MAP[rawDay.toLowerCase()] || rawDay;
      query = query.eq('day_of_week', normalizedDay);
    }

    if (roomCode) {
      query = query.eq('room_code', roomCode);
    }

    const { data: schedules, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { schedules },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('GET /api/schedules error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data jadwal.' },
      { status: 500 }
    );
  }
}