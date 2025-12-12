"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "./ui/aurora-background";
import Link from "next/link";
import { AnimatedTestimonialsDemo } from "./AnimatedTestimonialsDemo";
export function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex justify-between flex-col items-center">
            <div className="text-2xl md:text-5xl font-bold font-sans dark:text-white text-center py-10 px-5">
              The digital backstage where raw sparks become unforgettable
              performances.
              <p className="py-4 font-extralight text-2xl">
                Empowering creators and teams to bring their best work to life.
              </p>
              <button className="bg-black text-xl dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2">
                <Link href="/signup">Get Started</Link>
              </button>
            </div>
          </div>
          <div>
            <AnimatedTestimonialsDemo />
          </div>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
