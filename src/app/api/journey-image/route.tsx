import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const categoryColors: Record<string, string> = {
  build: '#84CC16',
  launch: '#F43F5E',
  metric: '#3B82F6',
  learn: '#8B5CF6',
  win: '#F59E0B',
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return new Response('Missing user_id', { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Builder';

  const { data: entries } = await supabase
    .from('shiplog_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const allEntries = entries || [];
  const totalLogs = allEntries.length;
  const wins = allEntries.filter((e: any) => e.category === 'win').length;

  // Active days
  const daySet = new Set(allEntries.map((e: any) => new Date(e.created_at).toISOString().slice(0, 10)));
  const activeDays = daySet.size;

  // Streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
    } else {
      if (i === 0) continue; // today might not have entry yet
      break;
    }
  }

  // Week data (Mon-Sun counts for current week)
  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  allEntries.forEach((e: any) => {
    const d = new Date(e.created_at);
    if (d >= monday) {
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      weekData[idx]++;
    }
  });

  const maxWeek = Math.max(...weekData, 1);
  const recent = allEntries.slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '600px',
          height: '800px',
          backgroundColor: '#0A0A0A',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          padding: '32px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', fontSize: '28px', fontWeight: 700, color: '#84CC16' }}>ShipLog</div>
          <div style={{ display: 'flex', fontSize: '18px', color: '#A3A3A3' }}>{userName}</div>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <div style={{ display: 'flex', fontSize: '36px', fontWeight: 800, color: '#84CC16' }}>
            {streak} day streak
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Logs', value: totalLogs },
            { label: 'Days', value: activeDays },
            { label: 'Wins', value: wins },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                backgroundColor: '#131313',
                borderRadius: '12px',
                padding: '16px 8px',
              }}
            >
              <div style={{ display: 'flex', fontSize: '28px', fontWeight: 700, color: '#FFFFFF' }}>{s.value}</div>
              <div style={{ display: 'flex', fontSize: '14px', color: '#737373' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
          <div style={{ display: 'flex', fontSize: '14px', color: '#737373', marginBottom: '8px' }}>This Week</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
            {weekData.map((count, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: `${Math.max((count / maxWeek) * 64, 4)}px`,
                    backgroundColor: count > 0 ? '#84CC16' : '#1F1F1F',
                    borderRadius: '4px',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {dayLabels.map((d, i) => (
              <div key={i} style={{ display: 'flex', flex: 1, justifyContent: 'center', fontSize: '11px', color: '#525252' }}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Recent entries */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
          <div style={{ display: 'flex', fontSize: '14px', color: '#737373', marginBottom: '4px' }}>Recent</div>
          {recent.map((entry: any, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderLeft: `4px solid ${categoryColors[entry.category] || '#84CC16'}`,
                backgroundColor: '#111111',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', width: '100%', fontSize: '13px', color: '#E5E7EB' }}>
                {(entry.text || '').slice(0, 50)}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: categoryColors[entry.category] || '#84CC16',
                  textTransform: 'uppercase' as any,
                  marginTop: '6px',
                }}
              >
                {entry.category || 'build'}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '16px',
            borderTop: '1px solid #1F1F1F',
            paddingTop: '16px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '12px', color: '#525252' }}>Made with ShipLog</div>
          <div style={{ display: 'flex', fontSize: '12px', color: '#525252' }}>Hosted on ScreenSnap</div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 800,
    }
  );
}
