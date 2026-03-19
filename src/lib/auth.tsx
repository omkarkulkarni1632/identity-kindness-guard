import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type PlatformRole = 'CISO' | 'IT' | 'HR'

export interface AuthUser {
  id: string
  email: string
  name: string
  platform_role: PlatformRole
  platform_user_id: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isRole: (role: PlatformRole | PlatformRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Demo users for testing (will work with Supabase auth once configured)
const DEMO_USERS: Record<string, AuthUser> = {
  'ciso@acme.com': {
    id: 'demo-ciso',
    email: 'ciso@acme.com',
    name: 'Rachel Foster',
    platform_role: 'CISO',
    platform_user_id: 'demo-ciso',
  },
  'it@acme.com': {
    id: 'demo-it',
    email: 'it@acme.com',
    name: 'James Wilson',
    platform_role: 'IT',
    platform_user_id: 'demo-it',
  },
  'hr@acme.com': {
    id: 'demo-hr',
    email: 'hr@acme.com',
    name: 'Lisa Park',
    platform_role: 'HR',
    platform_user_id: 'demo-hr',
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for demo session in localStorage
    const savedUser = localStorage.getItem('accessguard_demo_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {}
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Demo authentication
    const demoUser = DEMO_USERS[email.toLowerCase()]
    if (demoUser && password === 'demo123') {
      setUser(demoUser)
      localStorage.setItem('accessguard_demo_user', JSON.stringify(demoUser))
      return { error: null }
    }
    return { error: new Error('Invalid credentials. Use demo accounts: ciso@acme.com, it@acme.com, or hr@acme.com with password: demo123') }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('accessguard_demo_user')
  }

  const isRole = (role: PlatformRole | PlatformRole[]) => {
    if (!user) return false
    if (Array.isArray(role)) return role.includes(user.platform_role)
    return user.platform_role === role
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
