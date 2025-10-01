"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"

const features = [
  {
    title: "Performer Tools",
    description: "Capture ideas, mind maps, AI expander.",
  },
  {
    title: "Writer Tools",
    description: "Scripts, scene expander, feedback.",
  },
  {
    title: "Director Tools",
    description: "Organize shows, structure acts, give notes.",
  },
  {
    title: "Developer Tools",
    description: "Turn ideas into features, track progress.",
  },
  {
    title: "Collaboration Hub",
    description: "All roles together in real time.",
  },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 opacity-60" />
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full bg-purple-600 blur-3xl opacity-20"
          animate={{
            x: [0, 200, -200, 0],
            y: [0, -200, 200, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Header */}
      <header className="z-10 w-full px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-xl">🎭 SyncSparks</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link href="#features">Features</Link>
          <Link href="#about">About</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="font-semibold">
            Signup
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="z-10 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl">
          The digital backstage where raw sparks become unforgettable performances
        </h1>
        <Button
          asChild
          size="lg"
          className="mt-8 bg-purple-600 hover:bg-purple-700"
        >
          <Link href="/signup">Get Started</Link>
        </Button>
      </section>

      {/* Features */}
      <section
        id="features"
        className="z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-6 py-20 max-w-6xl mx-auto"
      >
        {features.map((f) => (
          <Card
            key={f.title}
            className="bg-white/10 border-white/20 text-white shadow-lg backdrop-blur-lg"
          >
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent>{f.description}</CardContent>
          </Card>
        ))}
      </section>

      {/* Footer */}
      <footer className="z-10 border-t border-white/20 py-6 px-6 flex justify-between text-sm">
        <span>© 2025 Backstage. All rights reserved.</span>
        <div className="flex space-x-4">
          <Link href="/docs">Docs</Link>
          <Link href="https://github.com/">GitHub</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
