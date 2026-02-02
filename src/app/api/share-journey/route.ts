import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

type ShareJourneyPayload = {
  user_id: string;
  user_name: string;
  streak: number;
  total_logs: number;
  active_days: number;
  wins: number;
  week_data: unknown;
  entries: unknown;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables are not configured.' },
      { status: 500 }
    );
  }

  let payload: ShareJourneyPayload;
  try {
    payload = (await request.json()) as ShareJourneyPayload;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const {
    user_id,
    user_name,
    streak,
    total_logs,
    active_days,
    wins,
    week_data,
    entries,
  } = payload;

  if (
    typeof user_id !== 'string' ||
    typeof user_name !== 'string' ||
    typeof streak !== 'number' ||
    typeof total_logs !== 'number' ||
    typeof active_days !== 'number' ||
    typeof wins !== 'number'
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid required fields.' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const shortId = nanoid(10);

  const { error: insertError } = await supabase
    .from('journey_shares')
    .insert({
      short_id: shortId,
      user_id,
      user_name,
      streak,
      total_logs,
      active_days,
      wins,
      week_data,
      entries,
    });

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to save journey share.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    shortId,
    shareUrl: `https://screensnap-delta.vercel.app/journey/${shortId}`,
  });
}
