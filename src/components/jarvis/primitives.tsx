import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("hud-panel flex min-h-0 flex-col p-2.5", className)}>
      {title ? (
        <header className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-1.5">
          <h2 className="hud-title truncate">{title}</h2>
          {right}
        </header>
      ) : null}
      <div className={cn("min-h-0 flex-1 overflow-hidden", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Bar({ label, value, tone = "cyan" }: { label: string; value: number; tone?: "cyan" | "online" | "warn" }) {
  const toneClass =
    tone === "online" ? "bg-online" : tone === "warn" ? "bg-warn" : "bg-cyan";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[0.7rem]">
        <span className="hud-label">{label}</span>
        <span className="font-mono text-cyan text-glow">{value}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", toneClass)}
          style={{ width: `${value}%`, boxShadow: "var(--shadow-glow)" }}
        />
      </div>
    </div>
  );
}

export function Gauge({
  label,
  value,
  size = 58,
}: {
  label: string;
  value: number;
  size?: number;
}) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={3}
            className="stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${(c * value) / 100} ${c}`}
            className="stroke-cyan"
            style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[0.7rem] text-cyan text-glow">
          {value}%
        </span>
      </div>
      <span className="hud-label">{label}</span>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "online" | "warn" }) {
  return (
    <div>
      <div className="hud-label">{label}</div>
      <div
        className={cn(
          "font-mono text-sm text-glow",
          tone === "online" ? "text-online" : tone === "warn" ? "text-warn" : "text-cyan",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function IconTile({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
}) {
  return (
    <button className="hud-tile flex flex-col items-center gap-1 px-1 py-2 text-center">
      <Icon className="h-4 w-4 text-cyan" />
      <span className="text-[0.6rem] font-medium uppercase tracking-widest text-foreground/90">
        {label}
      </span>
      {sub ? <span className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">{sub}</span> : null}
    </button>
  );
}

export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points, 1);
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${40 - (p / max) * 38}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={cn("h-full w-full", className)}>
      <polyline
        points={path}
        fill="none"
        strokeWidth={1}
        className="stroke-cyan"
        style={{ filter: "drop-shadow(0 0 3px currentColor)" }}
      />
      <polygon points={`0,40 ${path} 100,40`} className="fill-cyan/15" />
    </svg>
  );
}
