import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

const BASE_W = 1920;
const BASE_H = 1080;

/**
 * Scales a fixed 1920x1080 HUD canvas to fit the viewport exactly.
 * Guarantees the whole interface is visible at once with no scrolling.
 */
export function FitScreen({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  const measure = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setScale(Math.min(w / BASE_W, h / BASE_H));
  };

  useLayoutEffect(() => {
    measure();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
