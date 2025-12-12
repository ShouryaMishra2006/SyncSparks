"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeatureCards from "@/components/FeatureCards";
import { motion } from "framer-motion";
import { Sparkles, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { AuroraBackgroundDemo } from "@/components/AuroraBackgroundDemo";
import { AnimatedTestimonialsDemo } from "@/components/AnimatedTestimonialsDemo";
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
];

export default function LandingPage() {
  return (
    
    <div className="relative min-h-screen flex flex-col text-white bg-black">
      <Navbar />
      {/* Hero */}
        <div className="max-w-screen mx-auto grid grid-cols-1 gap-12 items-center bg-black">
          
          <AuroraBackgroundDemo/>
        </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <span className="text-white">syncsparks</span>
              </div>
              <p className="text-gray-400 max-w-md">
                The digital backstage where raw sparks become unforgettable
                performances. Empowering creators and teams to bring their best
                work to life.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="hover:text-purple-400 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#docs"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#support"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#privacy"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#terms"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 SyncSparks. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#twitter"
                className="hover:text-purple-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#github"
                className="hover:text-purple-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#linkedin"
                className="hover:text-purple-400 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#email"
                className="hover:text-purple-400 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
