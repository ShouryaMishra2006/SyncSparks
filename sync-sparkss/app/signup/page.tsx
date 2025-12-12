"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { AuroraBackground } from "@/components/ui/aurora-background";
export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");
  const [otp, setOtp] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const nickname = formData.get("nickname") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Signup successful! Please enter the OTP sent to your email.");
        setEmailForOtp(email);
        setOtpStage(true);
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Email verified! You can now login.");
        window.location.href = "/login";
      } else {
        alert(data.message || "OTP verification failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white">
      <AuroraBackground>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/30 text-gray-200 
      ">
              <div className="flex items-center space-x-2">
                <Image
                src="/logo.png"   
                alt="SyncSparks Logo"
                width={35}
                height={35}
              />
                <span className="font-bold text-xl text-gray-200">SyncSparks</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="py-2">Home</Link>
                <Link href="/login" className="px-4 py-2 font-semibold bg-[#9F4FB0] text-white rounded-lg hover:bg-[#F997C8] transition-colors shadow-md">
                  Login
                </Link>
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
                <Input
                  name="nickname"
                  placeholder="Nickname"
                  type="text"
                  required
                />
                <Input name="email" placeholder="Email" type="email" required />
                <Input
                  name="password"
                  placeholder="Password"
                  type="password"
                  required
                />

                <Button
                  type="submit"
                  className="w-full bg-[#9F4FB0] hover:bg-purple-700"
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
                  onClick={() => {
                    window.location.href =
                      "http://localhost:4000/api/auth/google";
                  }}
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
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      </AuroraBackground>
    </div>
  );
}
