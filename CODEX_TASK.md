# CODEX TASK: Create Dashboard Component

Create a new file `src/components/Dashboard.tsx` - a modern dashboard for authenticated users.

## Requirements

### Props
```tsx
interface DashboardProps {
  session: Session; // from @supabase/supabase-js
}
```

### Navbar (floating glass, matching landing page)
- Fixed top, centered, floating glass pill style
- Left: 📦 ShipLog logo (lime gradient text)
- Right: user display name or email + "Sign out" button
- Sign out calls `supabase.auth.signOut()` then `window.location.reload()`
- NO theme toggle (dark mode only)
- Use same `.sl-nav-floating` class from globals.css

### Layout
- max-w-2xl centered, padding
- Sections: streak + stats row, weekly chart, log input, entry timeline

### Streak + Stats Row
- Left: big fire emoji + streak count with lime gradient text
- Right: 3 stat pills inline - Total Logs, Active Days, Wins
- Use macos-window style card for the stats area

### Weekly Activity Chart
- 7 bars for last 7 days, lime gradient bars
- Same as current but use `.mock-bar` / `.mock-bar-chart` classes

### Log Input
- Textarea: "What did you ship today?"
- Category buttons below (Build, Launch, Metric, Learn, Win) using `.sl-cat-btn` classes
- "Log it" button (lime gradient)
- Public/private toggle
- On submit: insert into Supabase `shiplog_entries` table
  - columns: id (uuid), user_id, text, category, is_public, created_at

### Entry Timeline
- Filter pills at top (All, Build, Launch, Metric, Win, Learn)
- Each entry: colored left border by category, emoji, text, relative time, delete button on hover
- Fetch from Supabase `shiplog_entries` where user_id = session.user.id, order by created_at desc

### Supabase Integration
- Import `{ supabase }` from `@/lib/supabase`
- On mount: fetch entries from `shiplog_entries` where user_id matches
- Add entry: insert into `shiplog_entries`
- Delete entry: delete from `shiplog_entries` where id matches
- Calculate streak from entries (count consecutive days with entries)
- Calculate weekly data from entries

### Style
- Dark mode only (no light mode considerations)
- Use existing CSS classes: liquid-glass-card, sl-cat-btn, mock-bar, mock-bar-chart, macos-window, glow-lime-subtle
- Accent: lime green (#84CC16 / #A3E635)
- NO purple
- NO em dashes
- Minimal, clean, generous spacing

### Footer
- "Built by Jayesh Betala" linked to jayeshbetala.com
- "Try DashPane" linked to dashpane.pro
- Dynamic year

## DO NOT edit any other files. Only create src/components/Dashboard.tsx.
