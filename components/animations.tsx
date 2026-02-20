"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const naturalEase = [0.25, 0.1, 0.25, 1];
const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
};

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  duration = 0.8,
  className = "",
}: FadeInProps) {
  const directions = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 },
    none: { x: 0, y: 0 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directions[direction] }}
      transition={{
        duration,
        delay,
        ease: naturalEase,
        ...springTransition,
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Stagger({
  children,
  delay = 0.08,
  className = "",
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={{
        visible: {
          transition: {
            staggerChildren: delay,
            delayChildren: 0.2,
          },
        },
        hidden: {},
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileInView="visible"
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  className?: string;
}

export function StaggerItem({
  children,
  direction = "up",
  duration = 0.7,
  className = "",
}: StaggerItemProps) {
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 },
    none: { x: 0, y: 0 },
  };

  return (
    <motion.div
      className={className}
      variants={{
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration,
            ease: naturalEase,
            ...springTransition,
          },
        },
        hidden: { opacity: 0, ...directions[direction] },
      }}
    >
      {children}
    </motion.div>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className = "" }: ScaleInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: 0.6,
        delay,
        ease: naturalEase,
        ...springTransition,
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      {children}
    </motion.div>
  );
}
