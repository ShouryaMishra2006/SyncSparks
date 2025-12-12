"use client";
import React from "react";
import { Mic2, PenTool, Code2, Users } from "lucide-react";
const features = [
  {
    title: "Performer Tool",
    description: "Capture ideas instantly through text or voice-to-text inputs, then let AI refine them into clean summaries.Build interactive, editable mind maps with customizable nodes and connections, and export them as PDF/PNG.Organize creative flows with advanced search and filtering, and send ideas directly to writers using secure Writer IDs.",
    icon: Mic2,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Writer Tool",
    description: "Craft compelling stories with advanced writing features, collaboration tools, and intelligent content organization.",
    icon: PenTool,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Developer Tools",
    description: "Build faster with integrated development environments, version control, and seamless deployment workflows.",
    icon: Code2,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Collaboration Hub",
    description: "Connect your team with real-time collaboration, project management, and unified communication channels.",
    icon: Users,
    gradient: "from-orange-500 to-red-500",
  },
];

export default function Navbar(){
    return(
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-gray-200 rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    );
}