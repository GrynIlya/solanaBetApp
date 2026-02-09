"use client";

import { ReactNode } from "react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  className?: string;
}

export function AnimatedSection({ 
  children, 
  delay = 0, 
  direction = "up",
  className = "" 
}: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const getInitialStyles = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, transform: "translateY(30px)" };
      case "down":
        return { opacity: 0, transform: "translateY(-30px)" };
      case "left":
        return { opacity: 0, transform: "translateX(-30px)" };
      case "right":
        return { opacity: 0, transform: "translateX(30px)" };
      case "fade":
        return { opacity: 0 };
      default:
        return { opacity: 0, transform: "translateY(30px)" };
    }
  };

  const getFinalStyles = () => {
    return { opacity: 1, transform: "translate(0, 0)" };
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...getInitialStyles(),
        ...(isVisible ? getFinalStyles() : {}),
        transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
