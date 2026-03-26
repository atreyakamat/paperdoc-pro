"use client";

import React, { useEffect, useRef, useState } from "react";

export interface GradientBlindsProps {
  gradientColors: string[];
  angle?: number;
  noise?: number;
  blindCount?: number;
  blindMinWidth?: number;
  spotlightRadius?: number;
  spotlightSoftness?: number;
  spotlightOpacity?: number;
  mouseDampening?: number;
  distortAmount?: number;
  shineDirection?: "left" | "right" | "top" | "bottom";
  mixBlendMode?: any;
  className?: string;
}

export default function GradientBlinds({
  gradientColors = ["#FF9FFC", "#5227FF"],
  angle = 0,
  noise = 0.3,
  blindCount = 12,
  blindMinWidth = 50,
  spotlightRadius = 0.5,
  spotlightSoftness = 1,
  spotlightOpacity = 1,
  mouseDampening = 0.15,
  distortAmount = 0,
  shineDirection = "left",
  mixBlendMode = "lighten",
  className = "",
}: GradientBlindsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [actualBlindCount, setActualBlindCount] = useState(blindCount);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const maxBlinds = Math.floor(width / blindMinWidth);
        setActualBlindCount(Math.min(blindCount, maxBlinds > 0 ? maxBlinds : 1));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [blindCount, blindMinWidth]);

  useEffect(() => {
    let currentX = mousePos.x;
    let currentY = mousePos.y;
    let targetX = mousePos.x;
    let targetY = mousePos.y;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;
      }
    };

    const animate = () => {
      currentX += (targetX - currentX) * mouseDampening;
      currentY += (targetY - currentY) * mouseDampening;
      setMousePos({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mouseDampening]);

  const gradientString = `linear-gradient(${angle}deg, ${gradientColors.join(", ")})`;
  const blinds = Array.from({ length: actualBlindCount });

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full h-full bg-black ${className}`}
      style={{ mixBlendMode }}
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ background: gradientString }}
      />

      {/* Noise Overlay */}
      {noise > 0 && (
        <div
          className="absolute inset-0 opacity-50 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${0.65 + noise * 0.1}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Blinds */}
      <div className="absolute inset-0 flex w-full h-full">
        {blinds.map((_, i) => (
          <div
            key={i}
            className="h-full flex-1 border-r border-white/5 bg-black/20 backdrop-blur-[2px] transition-all duration-300"
            style={{
              transform: `skewY(${distortAmount}deg)`,
              boxShadow: shineDirection === "left" ? "inset 1px 0 2px rgba(255,255,255,0.05)" : "none",
            }}
          />
        ))}
      </div>

      {/* Spotlight */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: `${spotlightRadius * 100}%`,
          height: `${spotlightRadius * 100}%`,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, rgba(255,255,255,${spotlightOpacity}) 0%, rgba(255,255,255,0) ${spotlightSoftness * 100}%)`,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
