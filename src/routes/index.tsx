import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/jarvis/Dashboard";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S. — Futuristic AI Command Center" },
      {
        name: "description",
        content:
          "Holographic AI operating system dashboard: 3D neural core, system monitoring, security, drones, automation and voice command.",
      },
      { property: "og:title", content: "J.A.R.V.I.S. — Futuristic AI Command Center" },
      {
        property: "og:description",
        content:
          "A cinematic holographic command console with a live 3D AI core, telemetry, security and automation panels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
