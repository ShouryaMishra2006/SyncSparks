"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState("performer")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
        credentials: "include", 
      })

      const data = await res.json()
      if (res.ok) {
       if(role==="writer-director"){
          window.location.href="/writer-confirm";
       }
       else{
          window.location.href = data.redirectUrl || `/dashboard/${role}`;
       }
      
    } else {
      alert(data.message || "Login failed");
    }
    } catch (err) {
      console.error(err)
      alert("Server error")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = () => {
  const state = encodeURIComponent(JSON.stringify({ role }));
  window.location.href = `http://localhost:4000/api/auth/google?state=${state}`;
};


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
          className="absolute w-[800px] h-[800px] rounded-full bg-blue-600 blur-3xl opacity-20"
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
          <Link href="/">Home</Link>
          <Link href="/signup">Signup</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="z-10 flex flex-1 items-center justify-center px-6 py-20">
        <Card className="w-full max-w-md bg-white/10 border-white/20 text-white shadow-lg backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                name="email"
                placeholder="Email"
                type="email"
                required
                className="bg-black/40 border-white/20 text-white"
              />
              <Input
                name="password"
                placeholder="Password"
                type="password"
                required
                className="bg-black/40 border-white/20 text-white"
              />

              <Select onValueChange={setRole} defaultValue="performer">
                <SelectTrigger className="bg-black/40 border-white/20 text-white">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performer">Performer</SelectItem>
                  <SelectItem value="writer-director">Writer / Director</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login with Email"}
              </Button>

              <div className="text-center text-sm mt-2">OR</div>

              <Button
                type="button"
                onClick={handleOAuthLogin}
                className="w-full bg-red-500 hover:bg-red-600"
              >
                Continue with Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
