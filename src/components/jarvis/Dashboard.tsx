import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Bot,
  Cloud,
  Cpu,
  Database,
  Gauge as GaugeIcon,
  Home,
  LayoutGrid,
  Lock,
  MessageSquare,
  Mic,
  Navigation,
  Play,
  Plus,
  Power,
  Radar,
  Settings,
  Shield,
  Sliders,
  Terminal,
  User,
  Video,
  Workflow,
} from "lucide-react";
import { CoreCanvas } from "./CoreCanvas";
import { FitScreen } from "./FitScreen";
import {
  AiQuickControls,
  CalendarEvents,
  CoreShortcuts,
  CurrentTasks,
  DOCK_ITEMS,
  DataStream,
  DroneFleet,
  EnergyDistribution,
  FlightControl,
  GlobalTracking,
  LiveFeed,
  NewsUpdates,
  PowerCore,
  QuickLaunch,
  SecurityCenter,
  SuitStatus,
  SystemLogs,
  SystemMonitor,
  VoiceCommand,
} from "./panels";

const NAV = [
  { icon: Home, label: "Dashboard", sub: "Overview & Analytics" },
  { icon: Cpu, label: "Systems", sub: "System Management" },
  { icon: Sliders, label: "Control", sub: "Device Control" },
  { icon: Bot, label: "AI & Machine Learning", sub: "Deep Learning Core" },
  { icon: MessageSquare, label: "Communication", sub: "Calls, Messages, Mail" },
  { icon: Navigation, label: "Navigation", sub: "Maps, Routes & Tracking" },
  { icon: Shield, label: "Security", sub: "Access & Authentication" },
  { icon: Video, label: "Surveillance", sub: "Cameras & Monitoring" },
  { icon: Play, label: "Media Center", sub: "Music, Videos & Photos" },
  { icon: Database, label: "Database", sub: "Files, Logs & Records" },
  { icon: Workflow, label: "Automation", sub: "Tasks & Workflows" },
  { icon: Terminal, label: "Developer Tools", sub: "Code, Terminal & API" },
  { icon: Activity, label: "Diagnostics", sub: "Health & Reports" },
  { icon: Settings, label: "Settings", sub: "Preferences & Config" },
];

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hud-panel px-3 py-1.5 text-center">
      <div className="font-display text-lg leading-none text-cyan text-glow">
        {now ? now.toLocaleTimeString("en-GB") : "--:--:--"}
      </div>
      <div className="hud-label mt-0.5">
        {now
          ? now.toLocaleDateString("en-US", {
              weekday: "long",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Synchronizing"}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center gap-3 px-3 py-2">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <div className="absolute inset-0 animate-hud-spin rounded-full border border-cyan/40" />
        <div className="absolute inset-2 animate-hud-spin-rev rounded-full border border-dashed border-cyan/50" />
        <div
          className="absolute inset-4 animate-hud-pulse rounded-full"
          style={{ background: "var(--gradient-core)" }}
        />
        <Cpu className="relative h-5 w-5 text-cyan text-glow" />
      </div>
      <div className="shrink-0">
        <h1 className="font-display text-2xl leading-none tracking-[0.18em] text-foreground text-glow">
          J.A.R.V.I.S.
        </h1>
        <p className="hud-label mt-1">Just A Rather Very Intelligent System</p>
      </div>
      <span className="hud-label shrink-0 self-start">v9.8.7</span>

      <div className="hidden flex-1 flex-col items-center text-center lg:flex">
        <p className="text-[0.8rem] italic text-foreground/80">
          "I'm with you, till the end of the line."
        </p>
        <p className="hud-label mt-0.5">— J.A.R.V.I.S.</p>
      </div>

      <Clock />

      <div className="hud-panel flex items-center gap-2 px-3 py-1.5">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-online/50">
          <span className="h-2 w-2 animate-hud-pulse rounded-full bg-online" />
        </div>
        <div>
          <div className="hud-title">System Status</div>
          <div className="font-mono text-[0.65rem] text-online">Online · Fully Operational</div>
        </div>
      </div>

      <div className="hud-panel hidden items-center gap-2 px-3 py-1.5 xl:flex">
        <Cloud className="h-5 w-5 text-cyan" />
        <div>
          <div className="font-mono text-sm text-cyan text-glow">28°C</div>
          <div className="hud-label">Partly Cloudy · Bangalore</div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {[
          { icon: Mic, label: "Voice", badge: "" },
          { icon: Bell, label: "Alerts", badge: "6" },
          { icon: Bot, label: "AI", badge: "" },
          { icon: Settings, label: "Config", badge: "" },
          { icon: User, label: "Profile", badge: "" },
          { icon: Lock, label: "Lock", badge: "" },
          { icon: Power, label: "Power", badge: "" },
        ].map((b) => (
          <button
            key={b.label}
            className="hud-tile relative flex h-9 w-9 items-center justify-center"
            aria-label={b.label}
          >
            <b.icon className="h-4 w-4 text-cyan" />
            {b.badge ? (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive font-mono text-[0.55rem] text-destructive-foreground">
                {b.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </header>
  );
}

function SideNav() {
  const [active, setActive] = useState("Dashboard");
  return (
    <nav className="hud-panel flex w-[13.5rem] shrink-0 flex-col gap-0.5 p-1.5">
      {NAV.map((item) => {
        const isActive = item.label === active;
        return (
          <button
            key={item.label}
            onClick={() => setActive(item.label)}
            className={
              isActive
                ? "flex items-center gap-2 rounded-sm border border-cyan/60 bg-cyan/20 px-2 py-1.5 text-left"
                : "flex items-center gap-2 rounded-sm border border-transparent px-2 py-1.5 text-left transition-colors hover:border-cyan/40 hover:bg-cyan/10"
            }
          >
            <item.icon
              className={isActive ? "h-4 w-4 shrink-0 text-cyan text-glow" : "h-4 w-4 shrink-0 text-cyan/70"}
            />
            <span className="min-w-0">
              <span className="block truncate text-[0.68rem] font-semibold uppercase tracking-widest text-foreground/90">
                {item.label}
              </span>
              <span className="block truncate text-[0.55rem] uppercase tracking-wider text-muted-foreground">
                {item.sub}
              </span>
            </span>
            {isActive ? <span className="ml-auto h-1.5 w-1.5 animate-hud-pulse rounded-full bg-cyan" /> : null}
          </button>
        );
      })}
    </nav>
  );
}

const STATES = ["Idle", "Listening", "Thinking", "Processing", "Speaking", "Executing"] as const;

function CentralCore() {
  const [stateIndex, setStateIndex] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setStateIndex((i) => (i + 1) % STATES.length), 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div className="absolute inset-0">
        <CoreCanvas />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute h-[85%] w-[85%] max-w-[34rem] animate-hud-spin-slow rounded-full border border-cyan/20" />
        <div className="absolute h-[70%] w-[70%] max-w-[28rem] animate-hud-spin-rev rounded-full border border-dashed border-cyan/25" />
        <div className="translate-y-2 text-center">
          <div className="font-display text-2xl tracking-[0.28em] text-foreground text-glow">
            J.A.R.V.I.S.
          </div>
          <div className="mt-1 font-display text-sm tracking-[0.4em] text-cyan text-glow">ONLINE</div>
          <div className="mt-2 hud-label">
            Neural net · <span className="text-cyan">{STATES[stateIndex]}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between font-mono text-[0.58rem] text-cyan/80">
        <span>NEURAL LAYERS 128 · TOKENS 4.2M/S</span>
        <span className="animate-hud-pulse">REAL-TIME PROCESSING</span>
      </div>
    </div>
  );
}

function Dock() {
  return (
    <div className="hud-panel mx-3 mb-2 flex items-center gap-1.5 overflow-x-auto p-2">
      {DOCK_ITEMS.map((d) => (
        <button
          key={d.label}
          className="hud-tile flex min-w-[5.4rem] flex-col items-center gap-1 px-1 py-1.5"
        >
          <d.icon className="h-4 w-4 text-cyan" />
          <span className="text-[0.52rem] uppercase tracking-widest text-foreground/85">{d.label}</span>
        </button>
      ))}
      <button className="hud-tile flex min-w-[5.4rem] flex-col items-center gap-1 px-1 py-1.5">
        <Plus className="h-4 w-4 text-cyan" />
        <span className="text-[0.52rem] uppercase tracking-widest text-foreground/85">Add App</span>
      </button>
    </div>
  );
}

export function Dashboard() {
  return (
    <FitScreen>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <Header />
        <main className="flex min-h-0 flex-1 gap-2.5 px-3">
          <SideNav />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
            <div className="grid min-h-0 flex-[2] grid-cols-[17rem_minmax(0,1fr)_17rem] gap-2.5">
              <div className="flex min-h-0 flex-col gap-2.5">
                <SuitStatus className="flex-[1.1]" />
                <CurrentTasks className="flex-[0.9]" />
                <SystemMonitor className="flex-1" />
              </div>

              <div className="flex min-h-0 min-w-0 flex-col gap-2.5">
                <AiQuickControls />
                <CentralCore />
                <CoreShortcuts />
                <div className="grid h-[16rem] shrink-0 grid-cols-2 gap-2.5">
                  <PowerCore />
                  <EnergyDistribution />
                </div>
              </div>

              <div className="flex min-h-0 flex-col gap-2.5">
                <FlightControl className="flex-[1.45]" />
                <DroneFleet className="flex-[1.05]" />
                <QuickLaunch className="flex-[0.85]" />
                <VoiceCommand className="flex-[1.15]" />
              </div>
            </div>

            <div className="grid min-h-0 flex-[0.52] grid-cols-3 gap-2.5">
              <SecurityCenter />
              <DataStream />
              <SystemLogs />
            </div>

            <div className="grid min-h-0 flex-[0.62] grid-cols-4 gap-2.5">

              <LiveFeed />
              <GlobalTracking />
              <CalendarEvents />
              <NewsUpdates />
            </div>
          </div>
        </main>
        <Dock />
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-2 font-mono text-[0.55rem] text-cyan/60">
          <LayoutGrid className="h-3 w-3" />
          <GaugeIcon className="h-3 w-3" />
          <Radar className="h-3 w-3" />
          SYSTEM NOMINAL
        </div>
      </div>
    </FitScreen>
  );
}

