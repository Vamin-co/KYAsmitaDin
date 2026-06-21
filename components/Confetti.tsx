"use client";

// Brand-themed confetti burst (CSS only). Respects prefers-reduced-motion via globals.css.
const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: `${4 + i * 7}%`,
  background: i % 3 === 0 ? "#c5272b" : i % 3 === 1 ? "#ffb600" : "#e9e1d5",
  delay: `${(i % 5) * 90}ms`,
}));

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible" aria-hidden="true">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            position: "absolute",
            top: 0,
            left: c.left,
            width: 7,
            height: 11,
            borderRadius: 2,
            background: c.background,
            animation: "confetti-fall 1.1s ease-in forwards",
            animationDelay: c.delay,
          }}
        />
      ))}
    </div>
  );
}
