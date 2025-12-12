"use client";
import React from "react";
import Link from "next/link"
import Image from "next/image"
export default function Navbar(){
    return(
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
          <Link href="#features" className="py-2">Features</Link>
          <Link href="#about" className="py-2">About</Link>
          <Link href="/login" className="py-2">Login</Link>
          <Link href="/signup" className="px-4 py-2 font-semibold bg-[#9F4FB0] text-white rounded-lg hover:bg-[#F997C8] transition-colors shadow-md">
            Signup
          </Link>
        </nav>
      </header>
    );
}