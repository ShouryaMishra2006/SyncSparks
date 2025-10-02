"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [otpStage, setOtpStage] = useState(false)
  const [emailForOtp, setEmailForOtp] = useState("")
  const [otp, setOtp] = useState("")

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const nickname = formData.get("nickname") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname, email, password }),
      })

      const data = await res.json()
      if (res.ok) {
        alert("Signup successful! Please enter the OTP sent to your email.")
        setEmailForOtp(email)
        setOtpStage(true)
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

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("http://localhost:4000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp, otp }),
      })

      const data = await res.json()
      if (res.ok) {
        alert("Email verified! You can now login.")
        window.location.href = "/login"
      } else {
        alert(data.message || "OTP verification failed")
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
      {/* Background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 opacity-60" />
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full bg-purple-600 blur-3xl opacity-20"
          animate={{ x: [0, 200, -200, 0], y: [0, -200, 200, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Header */}
      <header className="z-10 w-full px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <span className="font-bold text-xl">🎭 SyncSparks</span>
        <nav className="hidden md:flex space-x-6">
          <Link href="/">Home</Link>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="z-10 flex flex-1 items-center justify-center px-6 py-20">
        <Card className="w-full max-w-md bg-white/10 border-white/20 text-white shadow-lg backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {otpStage ? "Verify OTP" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!otpStage ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <Input name="name" placeholder="Name" type="text" required />
                <Input name="nickname" placeholder="Nickname" type="text" required />
                <Input name="email" placeholder="Email" type="email" required />
                <Input name="password" placeholder="Password" type="password" required />

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
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
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  name="otp"
                  placeholder="Enter OTP"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
