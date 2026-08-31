import { useEffect, useState, type ReactNode } from "react";

const BASE_W = 1920;
const MIN_H = 900;

/**
 * Scales a fixed-width (1920px) HUD canvas so the whole interface fits the
 * viewport exactly — no page scrolling, no letterboxing.
 */
export function FitScreen({ children }: { children: ReactNode }) {
  const [box, setBox] = useState({ scale: 1, height: MIN_H });

  const measure = () => {
    const scale = window.innerWidth / BASE_W;
    setBox({ scale, height: Math.max(window.innerHeight / scale, MIN_H) });
  };

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        style={{
          width: BASE_W,
          height: box.height,
          transform: `scale(${box.scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
