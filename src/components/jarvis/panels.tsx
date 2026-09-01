import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Calculator,
  CalendarDays,
  Camera,
  CheckCircle2,
  Circle,
  Cloud,
  Cpu,
  Database,
  FileText,
  Fingerprint,
  Globe2,
  HardDrive,
  Loader2,
  Lock,
  Mail,
  MemoryStick,
  MessageSquare,
  Mic,
  Monitor,
  Newspaper,
  Plane,
  Radar,
  Rocket,
  Rss,
  Share2,
  Shield,
  ShieldCheck,
  Terminal,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
import { Bar, Gauge, IconTile, Panel, Sparkline, Stat } from "./primitives";
import suitImage from "@/assets/jarvis-suit.png";
import cityImage from "@/assets/jarvis-city.png";

/* ------------------------------- Suit status ------------------------------ */

export function SuitStatus({ className }: { className?: string }) {
  return (
    <Panel title="Suit Status — Mark LXXXV" className={className}>
      <div className="flex gap-3">
        <div className="relative w-24 shrink-0 overflow-hidden rounded-sm scanline">
          <img src={suitImage} alt="Holographic armor schematic" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 space-y-2">
          <Bar label="Power" value={98} />
          <Bar label="Fusion Core" value={100} tone="online" />
          <Bar label="Armor Integrity" value={97} />
          <Bar label="Weapons" value={100} tone="online" />
          <Bar label="Flight Systems" value={96} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {["Helmet", "Chest", "Arms", "Legs", "Core"].map((part) => (
          <div key={part} className="hud-tile px-1 py-1.5 text-center">
            <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">{part}</div>
            <div className="font-mono text-[0.7rem] text-cyan text-glow">100%</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center hud-title animate-hud-pulse">System Ready</div>
    </Panel>
  );
}

/* -------------------------------- AI tasks -------------------------------- */

const TASKS = [
  { name: "Analyze satellite data", state: "Completed", progress: 100 },
  { name: "Scan for hostile activity", state: "In Progress", progress: 62 },
  { name: "Update suit firmware", state: "Pending", progress: 0 },
  { name: "Prepare for mission", state: "Pending", progress: 0 },
  { name: "System optimization", state: "In Progress", progress: 41 },
  { name: "Background AI tasks", state: "Running", progress: 88 },
];

export function CurrentTasks({ className }: { className?: string }) {
  return (
    <Panel title="Current Tasks" className={className}>
      <ul className="space-y-2">
        {TASKS.map((t) => (
          <li key={t.name} className="space-y-1">
            <div className="flex items-center gap-2 text-[0.78rem]">
              {t.state === "Completed" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-online" />
              ) : t.state === "Pending" ? (
                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan" />
              )}
              <span className="flex-1 truncate text-foreground/90">{t.name}</span>
              <span
                className={
                  t.state === "Completed"
                    ? "text-[0.62rem] uppercase tracking-widest text-online"
                    : t.state === "Pending"
                      ? "text-[0.62rem] uppercase tracking-widest text-muted-foreground"
                      : "text-[0.62rem] uppercase tracking-widest text-cyan"
                }
              >
                {t.state}
              </span>
            </div>
            <div className="ml-5 h-[2px] overflow-hidden rounded bg-muted">
              <div className="h-full bg-cyan" style={{ width: `${t.progress}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-2 w-full hud-tile py-1 text-[0.6rem] uppercase tracking-[0.2em] text-cyan">
        View all tasks
      </button>
    </Panel>
  );
}

/* ----------------------------- System monitor ----------------------------- */

function useDrift(seed: number, base: number, spread = 6) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = setInterval(
      () => setV(Math.max(3, Math.min(99, base + Math.round((Math.random() - 0.5) * spread)))),
      1800 + seed * 250,
    );
    return () => clearInterval(id);
  }, [base, seed, spread]);
  return v;
}

export function SystemMonitor({ className }: { className?: string }) {
  const cpu = useDrift(1, 28);
  const ram = useDrift(2, 62);
  const gpu = useDrift(3, 41);
  const storage = useDrift(4, 78, 2);
  const series = useMemo(
    () => Array.from({ length: 40 }, (_, i) => 20 + Math.sin(i / 2.4) * 12 + Math.random() * 14),
    [],
  );

  return (
    <Panel title="System Monitor" className={className}>
      <div className="grid grid-cols-4 gap-1">
        <Gauge label="CPU" value={cpu} />
        <Gauge label="RAM" value={ram} />
        <Gauge label="GPU" value={gpu} />
        <Gauge label="Storage" value={storage} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="hud-label">Network</span>
        <div className="text-right font-mono text-[0.65rem] text-cyan text-glow">
          512.4 Mbps <span className="text-muted-foreground">uplink</span>
          <br />
          1.2 Gbps <span className="text-muted-foreground">downlink</span>
        </div>
      </div>
      <div className="h-14">
        <Sparkline points={series} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2">
        <Stat label="Latency" value="12 ms" />
        <Stat label="Packets" value="3,256" />
        <Stat label="Status" value="Secure" tone="online" />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Temp" value="46°C" />
        <Stat label="Battery" value="94%" tone="online" />
        <Stat label="Uptime" value="72:14" />
      </div>
    </Panel>
  );
}

/* ---------------------------- AI quick controls --------------------------- */

const QUICK_CONTROLS = [
  { icon: Mic, label: "Voice Command", sub: "Activate" },
  { icon: Globe2, label: "Hologram", sub: "Display" },
  { icon: Activity, label: "Diagnostics", sub: "Run" },
  { icon: Rss, label: "Updates", sub: "Check" },
  { icon: MemoryStick, label: "Memory", sub: "Scan" },
  { icon: Zap, label: "Quick Access", sub: "Open" },
];

export function AiQuickControls() {
  return (
    <div className="hud-panel grid grid-cols-6 gap-1.5 p-2">
      {QUICK_CONTROLS.map((c) => (
        <IconTile key={c.label} icon={c.icon} label={c.label} sub={c.sub} />
      ))}
    </div>
  );
}

const CORE_SHORTCUTS = [
  { icon: Terminal, label: "Terminal", sub: "Access Console" },
  { icon: Bot, label: "AI Chat", sub: "Talk to J.A.R.V.I.S." },
  { icon: Globe2, label: "Hologram UI", sub: "3D Interface" },
  { icon: FileText, label: "File Browser", sub: "System Files" },
  { icon: Cpu, label: "Code Editor", sub: "Developer Mode" },
];

export function CoreShortcuts() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {CORE_SHORTCUTS.map((s) => (
        <button key={s.label} className="hud-panel flex items-center gap-2 px-2 py-2 text-left">
          <s.icon className="h-4 w-4 shrink-0 text-cyan" />
          <span className="min-w-0">
            <span className="block truncate text-[0.68rem] uppercase tracking-widest text-foreground/90">
              {s.label}
            </span>
            <span className="block truncate text-[0.55rem] uppercase tracking-wider text-muted-foreground">
              {s.sub}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- Flight control ------------------------------ */

export function FlightControl({ className }: { className?: string }) {
  const systems = [
    { label: "Repulsors", value: "Online" },
    { label: "Unibeam", value: "Online" },
    { label: "Flight", value: "Enabled" },
    { label: "Shield", value: "100%" },
    { label: "Missiles", value: "Armed" },
  ];
  return (
    <Panel title="Flight Control" className={className}>
      <div className="flex gap-3">
        <div className="w-24 shrink-0 space-y-2">
          <Stat label="Altitude" value="10,900 FT" />
          <Stat label="Speed" value="620 MPH" />
          <Stat label="Heading" value="270°" />
          <Stat label="Location" value="Malibu" />
          <Stat label="Status" value="Stable" tone="online" />
        </div>
        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute inset-2 rounded-full border border-cyan/25 animate-hud-spin-slow" />
          <div className="absolute inset-6 rounded-full border border-dashed border-cyan/20 animate-hud-spin-rev" />
          <Rocket className="h-16 w-16 text-cyan text-glow animate-hud-pulse" />
        </div>
        <ul className="w-24 shrink-0 space-y-1.5">
          {systems.map((s) => (
            <li key={s.label} className="hud-tile px-1.5 py-1">
              <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="font-mono text-[0.62rem] text-online">{s.value}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {["Auto-Pilot", "Takeoff", "Landing", "Return"].map((a) => (
          <button key={a} className="hud-tile py-1 text-[0.58rem] uppercase tracking-widest text-cyan">
            {a}
          </button>
        ))}
      </div>
      <div className="mt-2 text-center hud-label">Ready for takeoff</div>
      <button className="mt-1 w-full hud-tile py-1.5 font-display text-[0.7rem] tracking-[0.3em] text-cyan text-glow">
        ENGAGE
      </button>
    </Panel>
  );
}

/* ------------------------------- Drone fleet ------------------------------ */

const DRONES = [
  { id: "ALPHA 01", battery: 92, signal: 98 },
  { id: "ALPHA 02", battery: 74, signal: 90 },
  { id: "BETA 01", battery: 61, signal: 88 },
  { id: "BETA 02", battery: 55, signal: 79 },
  { id: "GAMMA 01", battery: 87, signal: 94 },
  { id: "GAMMA 02", battery: 43, signal: 71 },
];

export function DroneFleet({ className }: { className?: string }) {
  return (
    <Panel title="Drone Fleet" className={className}>
      <div className="flex gap-3">
        <div className="relative aspect-square flex-1">
          <div className="absolute inset-0 rounded-full border border-cyan/30" />
          <div className="absolute inset-[18%] rounded-full border border-cyan/25" />
          <div className="absolute inset-[36%] rounded-full border border-cyan/20" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-cyan/15" />
          <div className="absolute top-1/2 left-0 h-px w-full bg-cyan/15" />
          <div className="absolute inset-0 animate-hud-spin">
            <div
              className="h-1/2 w-1/2 origin-bottom-right"
              style={{
                background:
                  "conic-gradient(from 180deg, color-mix(in oklab, var(--glow) 35%, transparent), transparent 45%)",
              }}
            />
          </div>
          {[
            [30, 24],
            [64, 38],
            [46, 62],
            [72, 70],
            [22, 68],
          ].map(([x, y]) => (
            <Radar
              key={`${x}-${y}`}
              className="absolute h-3 w-3 text-cyan text-glow animate-hud-pulse"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
        </div>
        <div className="w-[54%] space-y-1.5">
          <div className="hud-tile px-2 py-1">
            <div className="hud-label">Active Devices</div>
            <div className="font-mono text-lg text-online text-glow">12</div>
          </div>
          <div className="hud-tile px-2 py-1">
            <div className="hud-label">Offline Devices</div>
            <div className="font-mono text-lg text-warn">03</div>
          </div>
          <ul className="space-y-1">
            {DRONES.map((d) => (
              <li key={d.id} className="flex items-center justify-between border-b border-border/60 pb-0.5 text-[0.62rem]">
                <span className="font-mono text-foreground/85">{d.id}</span>
                <span className="font-mono text-muted-foreground">{d.battery}%</span>
                <span className="flex items-center gap-1 text-online">
                  <Wifi className="h-3 w-3" />
                  {d.signal}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-2 text-center hud-label">
        Fleet status: <span className="text-online">Optimal</span>
      </div>
    </Panel>
  );
}

/* ------------------------------ Voice command ----------------------------- */

const COMMANDS = [
  "Open the suit",
  "Show me the map",
  "Play my music",
  "Run diagnostics",
  "What's the weather?",
  "Open camera feed",
  "Read notifications",
  "Send message",
];

export function VoiceCommand({ className }: { className?: string }) {
  const bars = useMemo(() => Array.from({ length: 34 }, () => 20 + Math.random() * 80), []);
  return (
    <Panel title="Voice Command" className={className} bodyClassName="flex flex-col">
      <div className="flex h-10 shrink-0 items-center justify-center gap-[3px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-cyan animate-hud-pulse"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 60}ms`,
              boxShadow: "var(--shadow-glow)",
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex shrink-0 flex-col items-center">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-cyan/40">
          <div className="absolute inset-0 animate-hud-spin rounded-full border border-dashed border-cyan/40" />
          <Mic className="h-6 w-6 text-cyan text-glow" />
        </div>
        <div className="mt-1 hud-title animate-hud-pulse">Listening…</div>
        <div className="text-[0.7rem] italic text-muted-foreground">"How can I help you, Sir?"</div>
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-hidden border-t border-border pt-2">
        <div className="hud-label mb-1">Suggested commands</div>
        <ul className="space-y-0.5">
          {COMMANDS.map((c) => (
            <li key={c} className="flex items-center gap-2 text-[0.7rem] text-foreground/85">
              <MessageSquare className="h-3 w-3 text-cyan" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ------------------------------ Quick launch ------------------------------ */

const APPS = [
  { icon: Mail, label: "Email" },
  { icon: MessageSquare, label: "Messages" },
  { icon: Video, label: "Video Conf." },
  { icon: Globe2, label: "Hologram" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: CheckCircle2, label: "Tasks" },
  { icon: FileText, label: "Notes" },
  { icon: Calculator, label: "Calculator" },
  { icon: Newspaper, label: "News Feed" },
  { icon: Share2, label: "Social" },
  { icon: Terminal, label: "Terminal" },
  { icon: Bot, label: "AI Chat" },
];

export function QuickLaunch({ className }: { className?: string }) {
  return (
    <Panel title="Quick Launch" className={className}>
      <div className="grid h-full grid-cols-6 grid-rows-2 gap-1">
        {APPS.map((a) => (
          <IconTile key={a.label} icon={a.icon} label={a.label} />
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------- Power core ------------------------------- */

export function PowerCore() {
  return (
    <Panel title="Power Core">
      <div className="flex h-full items-center gap-4">
        <div className="w-44 shrink-0">
          <div className="hud-label">Arc Reactor</div>
          <div className="font-display text-2xl text-online text-glow">100%</div>
          <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
            <Stat label="Output" value="1.21 TW" />
            <Stat label="Efficiency" value="99.9%" />
            <Stat label="Battery" value="98%" tone="online" />
            <Stat label="Stability" value="Stable" tone="online" />
          </div>
        </div>
        <div className="relative flex aspect-square h-full max-h-28 items-center justify-center">

          <div className="absolute inset-0 rounded-full animate-hud-spin border border-cyan/30" />
          <div className="absolute inset-3 rounded-full animate-hud-spin-rev border border-dashed border-cyan/40" />
          <div
            className="absolute inset-6 rounded-full animate-hud-pulse"
            style={{ background: "var(--gradient-core)" }}
          />
          <Zap className="relative h-9 w-9 text-cyan text-glow" />
        </div>
      </div>
    </Panel>
  );
}

const ENERGY = [
  { label: "AI Core", value: 42 },
  { label: "Computer", value: 23 },
  { label: "Smart Home", value: 15 },
  { label: "Network", value: 10 },
  { label: "Automation", value: 6 },
  { label: "Backup", value: 4 },
];

export function EnergyDistribution() {
  let offset = 0;
  return (
    <Panel title="Energy Distribution">
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 42 42" className="h-28 w-28 -rotate-90">
          {ENERGY.map((e, i) => {
            const dash = (e.value / 100) * 100;
            const el = (
              <circle
                key={e.label}
                cx="21"
                cy="21"
                r="15.9"
                fill="none"
                strokeWidth="5"
                className="stroke-cyan"
                strokeOpacity={1 - i * 0.14}
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={-offset}
                pathLength={100}
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <ul className="flex-1 space-y-1">
          {ENERGY.map((e, i) => (
            <li key={e.label} className="flex items-center gap-2 text-[0.7rem]">
              <span
                className="h-2 w-2 rounded-full bg-cyan"
                style={{ opacity: 1 - i * 0.14 }}
              />
              <span className="flex-1 text-foreground/85">{e.label}</span>
              <span className="font-mono text-cyan">{e.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ----------------------------- Security center ---------------------------- */

const SECURITY = [
  { icon: Shield, label: "Firewall", value: "Active" },
  { icon: Lock, label: "Encryption", value: "AES-256" },
  { icon: Fingerprint, label: "Authentication", value: "Verified" },
  { icon: AlertTriangle, label: "Intrusion", value: "None" },
  { icon: Monitor, label: "Devices", value: "12 Auth" },
  { icon: Wifi, label: "Network", value: "Shielded" },
];

export function SecurityCenter() {
  return (
    <Panel title="Security Center">
      <div className="grid grid-cols-2 gap-1.5">
        {SECURITY.map((s) => (
          <div key={s.label} className="hud-tile flex items-center gap-2 px-2 py-1.5">
            <s.icon className="h-3.5 w-3.5 text-cyan" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.58rem] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </span>
              <span className="block truncate font-mono text-[0.62rem] text-online">{s.value}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 border border-online/40 bg-online/10 py-1.5">
        <ShieldCheck className="h-4 w-4 text-online" />
        <span className="font-display text-[0.72rem] tracking-[0.3em] text-online text-glow">SECURE</span>
      </div>
      <div className="mt-1 hud-label text-center">Threat level: minimal</div>
    </Panel>
  );
}

export function DataStream() {
  const series = useMemo(
    () => Array.from({ length: 48 }, (_, i) => 18 + Math.abs(Math.sin(i / 3)) * 26 + Math.random() * 10),
    [],
  );
  return (
    <Panel title="Data Stream">
      <div className="h-16">
        <Sparkline points={series} />
      </div>
      <div className="relative mt-1 h-[2px] overflow-hidden bg-muted">
        <div className="absolute h-full w-1/3 animate-stream bg-cyan" />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Packets" value="18.4k/s" />
        <Stat label="Upload" value="512 Mbps" />
        <Stat label="Download" value="1.2 Gbps" />
      </div>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <Stat label="API Calls" value="2,481" />
        <Stat label="Servers" value="14 OK" tone="online" />
        <Stat label="AI Load" value="37%" />
      </div>
    </Panel>
  );
}

/* -------------------------------- Bottom row ------------------------------ */

export function LiveFeed() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Panel
      title="Live Feed — Stark Tower"
      right={
        <span className="flex items-center gap-1 text-[0.6rem] uppercase tracking-widest text-destructive">
          <span className="h-1.5 w-1.5 animate-hud-pulse rounded-full bg-destructive" /> REC
        </span>
      }
    >
      <div className="relative overflow-hidden rounded-sm scanline">
        <img src={cityImage} alt="Night city surveillance feed" className="h-36 w-full object-cover" loading="lazy" />
        <div className="absolute left-2 top-2 font-mono text-[0.6rem] text-cyan text-glow">CAM 01 · 4K</div>
        <div className="absolute right-2 top-2 font-mono text-[0.6rem] text-cyan text-glow">{time}</div>
        <div className="absolute bottom-2 left-2 font-mono text-[0.58rem] text-online">
          MOTION DETECTED · 2 OBJECTS
        </div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {["Cam 01", "Cam 02", "Cam 03", "Cam 04"].map((c) => (
          <button key={c} className="hud-tile flex items-center justify-center gap-1 py-1 text-[0.58rem] uppercase tracking-widest text-cyan">
            <Camera className="h-3 w-3" /> {c}
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function GlobalTracking() {
  const nodes = [
    [22, 38],
    [34, 55],
    [48, 30],
    [58, 62],
    [70, 42],
    [82, 58],
    [40, 72],
  ];
  return (
    <Panel title="Global Tracking" bodyClassName="flex flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-sm border border-cyan/20 bg-cyan/5">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--cyan) 55%, transparent) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 75%)",
          }}
        />
        {nodes.map(([x, y], i) => (
          <span key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
            <span className="block h-1.5 w-1.5 rounded-full bg-glow animate-hud-pulse" style={{ boxShadow: "var(--shadow-glow)" }} />
          </span>
        ))}
        <svg className="absolute inset-0 h-full w-full">
          {nodes.slice(1).map(([x, y], i) => {
            const [px, py] = nodes[i] ?? [0, 0];
            return (
              <line
                key={i}
                x1={`${px}%`}
                y1={`${py}%`}
                x2={`${x}%`}
                y2={`${y}%`}
                className="stroke-cyan/40"
                strokeWidth={0.6}
                strokeDasharray="3 3"
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between hud-label">
        <span>
          Online <span className="font-mono text-online">128</span> locations
        </span>
        <span>
          Nodes <span className="font-mono text-cyan">42</span>
        </span>
      </div>
    </Panel>
  );
}

const EVENTS = [
  { time: "10:00 AM", title: "Project Meeting" },
  { time: "01:00 PM", title: "R&D Review" },
  { time: "07:30 PM", title: "Dinner with Team" },
  { time: "09:00 PM", title: "Workout" },
];

export function CalendarEvents() {
  const today = new Date();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <Panel title="Calendar & Events">
      <div className="flex gap-3">
        <div className="w-[52%]">
          <div className="mb-1 text-center font-display text-[0.62rem] tracking-[0.2em] text-cyan">
            {today.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
          </div>
          <div className="grid grid-cols-7 gap-[2px] text-center text-[0.5rem] uppercase text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-[2px] text-center font-mono text-[0.6rem]">
            {days.map((d) => (
              <span
                key={d}
                className={
                  d === today.getDate()
                    ? "rounded-sm bg-cyan/30 text-glow text-cyan"
                    : "text-foreground/70"
                }
              >
                {d}
              </span>
            ))}
          </div>
        </div>
        <ul className="flex-1 space-y-1.5">
          {EVENTS.map((e) => (
            <li key={e.title} className="flex items-center gap-2 border-b border-border/60 pb-1 text-[0.68rem]">
              <span className="font-mono text-cyan">{e.time}</span>
              <span className="flex-1 truncate text-foreground/85">{e.title}</span>
            </li>
          ))}
        </ul>
      </div>
      <button className="mt-2 w-full hud-tile py-1 text-[0.58rem] uppercase tracking-[0.2em] text-cyan">
        View full schedule
      </button>
    </Panel>
  );
}

const LOGS = [
  "System boot completed",
  "AI core started",
  "Network connection established",
  "Database synchronized",
  "Security protocols activated",
  "All core systems online",
  "Diagnostics completed",
  "Backup completed",
  "No threats detected",
];

export function SystemLogs() {
  return (
    <Panel title="System Logs">
      <ul className="space-y-[3px] font-mono text-[0.62rem]">
        {LOGS.map((l, i) => (
          <li key={l} className="flex gap-2">
            <span className="text-cyan/70">21:4{i}:1{i}</span>
            <span className={l.includes("No threats") ? "text-online" : "text-foreground/75"}>{l}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const NEWS = [
  { title: "Stark Industries Unveils New Arc Reactor", when: "Today" },
  { title: "Global Security Summit 2026", when: "2h ago" },
  { title: "New AI Breakthrough Achieved", when: "4h ago" },
  { title: "Market Update: Tech Stocks Rally", when: "5h ago" },
  { title: "System Update Available", when: "6h ago" },
];

export function NewsUpdates() {
  return (
    <Panel title="News & Updates">
      <ul className="space-y-1.5">
        {NEWS.map((n) => (
          <li key={n.title} className="flex items-center gap-2 border-b border-border/60 pb-1 text-[0.68rem]">
            <Rss className="h-3 w-3 shrink-0 text-cyan" />
            <span className="flex-1 truncate text-foreground/85">{n.title}</span>
            <span className="shrink-0 font-mono text-[0.55rem] text-muted-foreground">{n.when}</span>
          </li>
        ))}
      </ul>
      <button className="mt-2 w-full hud-tile py-1 text-[0.58rem] uppercase tracking-[0.2em] text-cyan">
        View all news
      </button>
    </Panel>
  );
}

export const DOCK_ITEMS = [
  { icon: Cpu, label: "Command Center" },
  { icon: Bot, label: "AI Assistant" },
  { icon: Globe2, label: "Hologram 3D" },
  { icon: Activity, label: "Data Analytics" },
  { icon: Cloud, label: "Cloud Storage" },
  { icon: Lock, label: "Encryption" },
  { icon: HardDrive, label: "Backup" },
  { icon: Monitor, label: "Diagnostics" },
  { icon: Zap, label: "Performance" },
  { icon: Database, label: "Energy Grid" },
  { icon: Radar, label: "Smart Home" },
  { icon: Plane, label: "Vehicle Control" },
  { icon: Rocket, label: "Air Traffic" },
  { icon: CheckCircle2, label: "Task Automation" },
  { icon: Calculator, label: "Financial" },
];
