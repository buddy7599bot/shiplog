import React, { forwardRef } from "react";

type WeekDatum = { day: string; count: number };

type Entry = {
  text: string;
  category: string;
  created_at: string;
};

type Props = {
  userName: string;
  streak: number;
  weekData: WeekDatum[];
  entries: Entry[];
  totalLogs: number;
  activeDays: number;
  wins: number;
};

const categoryColors: Record<string, string> = {
  build: "#84CC16",
  launch: "#F43F5E",
  metric: "#3B82F6",
  learn: "#8B5CF6",
  win: "#F59E0B",
};

const JourneyCard = forwardRef<HTMLDivElement, Props>(function JourneyCard(
  { userName, streak, weekData, entries, totalLogs, activeDays, wins },
  ref
) {
  const maxCount = Math.max(1, ...weekData.map((d) => d.count));
  const visibleEntries = entries.slice(0, 5);

  return (
    <div
      ref={ref}
      style={{
        width: 600,
        backgroundColor: "#0A0A0A",
        borderRadius: 16,
        padding: 32,
        color: "#FFFFFF",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: "#84CC16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.4 }}>
            ShipLog
          </div>
        </div>
        <div style={{ fontSize: 14, color: "#C7C7C7" }}>{userName}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#84CC16" }}>
            {streak} day streak
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total Logs", value: totalLogs },
          { label: "Active Days", value: activeDays },
          { label: "Wins", value: wins },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: "#131313",
              borderRadius: 12,
              padding: "12px 14px",
              border: "1px solid #1F1F1F",
            }}
          >
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>
          Weekly activity
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            height: 90,
          }}
        >
          {weekData.map((d) => {
            const height = Math.max(6, Math.round((d.count / maxCount) * 70));
            return (
              <div
                key={d.day}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: 40,
                    height,
                    backgroundColor: "#84CC16",
                    borderRadius: "6px 6px 0 0",
                    opacity: 0.9,
                  }}
                />
                <div style={{ fontSize: 11, color: "#6B7280" }}>{d.day}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>
          Recent public entries
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visibleEntries.map((entry, index) => {
            const categoryColor =
              categoryColors[entry.category.toLowerCase()] ?? "#374151";
            return (
              <div
                key={`${entry.created_at}-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  backgroundColor: "#111111",
                  borderRadius: 10,
                  padding: "10px 12px",
                  borderLeft: `4px solid ${categoryColor}`,
                }}
              >
                <div style={{ fontSize: 13, color: "#E5E7EB" }}>
                  {entry.text}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: categoryColor,
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      color: categoryColor,
                      fontSize: 14,
                      marginRight: 4,
                    }}
                  >
                    ●
                  </span>
                  {entry.category}
                </div>
              </div>
            );
          })}
          {visibleEntries.length === 0 && (
            <div
              style={{
                fontSize: 12,
                color: "#6B7280",
                backgroundColor: "#111111",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              No public entries yet.
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#6B7280",
          borderTop: "1px solid #1F1F1F",
          paddingTop: 16,
          marginTop: 8,
        }}
      >
        <div>Made with ShipLog</div>
        <div>Hosted on ScreenSnap</div>
      </div>
    </div>
  );
});

export default JourneyCard;
