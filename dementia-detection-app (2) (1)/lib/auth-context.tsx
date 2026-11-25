"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type UserRole = "patient" | "caregiver" | "doctor"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for the prototype
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  "patient@neurosense.com": {
    password: "password",
    user: {
      id: "p-001",
      name: "Margaret Thompson",
      email: "patient@neurosense.com",
      role: "patient",
      createdAt: "2025-11-15",
    },
  },
  "doctor@neurosense.com": {
    password: "password",
    user: {
      id: "d-001",
      name: "Dr. Sarah Chen",
      email: "doctor@neurosense.com",
      role: "doctor",
      createdAt: "2025-06-01",
    },
  },
  "caregiver@neurosense.com": {
    password: "password",
    user: {
      id: "c-001",
      name: "James Thompson",
      email: "caregiver@neurosense.com",
      role: "caregiver",
      createdAt: "2025-09-20",
    },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const entry = DEMO_USERS[email]
    if (!entry || entry.password !== password) {
      throw new Error("Invalid email or password")
    }
    setUser(entry.user)
  }, [])

  const register = useCallback(
    async (name: string, email: string, _password: string, role: UserRole) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      if (DEMO_USERS[email]) {
        throw new Error("Email already exists")
      }
      const newUser: User = {
        id: `u-${Date.now()}`,
        name,
        email,
        role,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setUser(newUser)
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
