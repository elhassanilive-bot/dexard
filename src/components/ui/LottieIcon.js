"use client";

import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";

export default function LottieIcon({ jsonPath, playToken, fallback, className = "h-5 w-5" }) {
  const [animationData, setAnimationData] = useState(null);
  const lottieRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function loadAnimation() {
      if (!jsonPath) {
        setAnimationData(null);
        return;
      }

      try {
        const response = await fetch(jsonPath, { cache: "force-cache" });
        if (!response.ok) {
          if (alive) setAnimationData(null);
          return;
        }

        const payload = await response.json();
        if (alive) setAnimationData(payload);
      } catch {
        if (alive) setAnimationData(null);
      }
    }

    loadAnimation();
    return () => {
      alive = false;
    };
  }, [jsonPath]);

  useEffect(() => {
    if (!animationData || !playToken || !lottieRef.current) return;
    lottieRef.current.stop();
    lottieRef.current.goToAndPlay(0, true);
  }, [animationData, playToken]);

  if (!animationData) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <span className={className}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}
