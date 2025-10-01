"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setLoading(true)

  const formData = new FormData(e.currentTarget)
  const name = formData.get("name")
  const nickname = formData.get("nickname")
  const email = formData.get("email")
  const password = formData.get("password")

  try {
    const res = await fetch("http://localhost:4000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, nickname, email, password }),
    })

    const data = await res.json()
    if (res.ok) {
      alert("Signup successful! Please check your email for OTP.")
      
    } else {
      alert(data.message || "Signup failed")
    }
  } catch (err) {
    console.error(err)
    alert("Server error")
  } finally {
    setLoading(false)
  }
}


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
          <span className="font-bold text-xl">🎭 Backstage</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link href="/">Home</Link>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      {/* Signup Form */}
      <main className="z-10 flex flex-1 items-center justify-center px-6 py-20">
        <Card className="w-full max-w-md bg-white/10 border-white/20 text-white shadow-lg backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Input placeholder="Name" type="text" required className="bg-black/40 border-white/20 text-white" />
              </div>
              <div>
                <Input placeholder="Nickname" type="text" required className="bg-black/40 border-white/20 text-white" />
              </div>
              <div>
                <Input placeholder="Email" type="email" required className="bg-black/40 border-white/20 text-white" />
              </div>
              <div>
                <Input placeholder="Password" type="password" required className="bg-black/40 border-white/20 text-white" />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </Button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/20" />
                <span className="px-2 text-sm text-gray-400">or</span>
                <div className="flex-grow border-t border-white/20" />
              </div>

              {/* Google Signup */}
              <Button
                type="button"
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => alert("Google signup not wired yet")}
              >
                Continue with Google
              </Button>

              <p className="text-sm text-center text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

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
