"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface IdeaInboxItem {
  performerName: string;
  performerId: string;
  idea: string;
  submittedAt: string; 
}

interface WriterInfo {
  writerId: string;
  ideaInbox?: IdeaInboxItem[];
}

interface User {
  _id: string;      
  name: string;
  nickname?: string; 
  email: string;
  isVerified: boolean;
  writer?: WriterInfo;
}


type AuthContextType = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  setUser: (u: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          method: "GET",
          credentials: "include",
        })
        console.log(res)
        if (!res.ok) throw new Error("Not logged in")
        const data = await res.json()
        setUser(data.user) 
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
