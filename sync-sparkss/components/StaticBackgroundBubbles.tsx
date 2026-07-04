"use client";

const bubbles = [
  { size: 120, top: "8%", left: "6%", color: "hsl(210, 70%, 58%)" },
  { size: 180, top: "18%", left: "74%", color: "hsl(280, 65%, 60%)" },
  { size: 140, top: "58%", left: "12%", color: "hsl(150, 60%, 48%)" },
  { size: 220, top: "64%", left: "72%", color: "hsl(25, 80%, 58%)" },
  { size: 100, top: "36%", left: "42%", color: "hsl(330, 70%, 62%)" },
  { size: 160, top: "82%", left: "34%", color: "hsl(48, 82%, 56%)" },
];

export default function StaticBackgroundBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {bubbles.map((bubble, index) => (
        <div
          key={index}
          className="absolute rounded-full opacity-20 blur-sm"
          style={{
            width: bubble.size,
            height: bubble.size,
            top: bubble.top,
            left: bubble.left,
            background: bubble.color,
          }}
        />
      ))}
    </div>
  );
}
