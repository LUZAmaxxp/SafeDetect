import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/authService'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signUp: (userData: SignUpData) => Promise<void>
  signOut: () => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  magicLinkSignIn: (email: string) => Promise<void>
}

interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on app load
    const token = localStorage.getItem('authToken')
    if (token) {
      // Verify token and get user data
      authService.getCurrentUser()
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem('authToken')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await authService.signIn(email, password)
      setUser(response.user)
      if (rememberMe) {
        localStorage.setItem('authToken', response.token)
      } else {
        sessionStorage.setItem('authToken', response.token)
      }
    } catch (error) {
      throw error
    }
  }

  const signUp = async (userData: SignUpData) => {
    try {
      const response = await authService.signUp(userData)
      setUser(response.user)
      localStorage.setItem('authToken', response.token)
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email)
    } catch (error) {
      throw error
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      await authService.resetPassword(token, password)
    } catch (error) {
      throw error
    }
  }

  const magicLinkSignIn = async (email: string) => {
    try {
      await authService.magicLinkSignIn(email)
    } catch (error) {
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    magicLinkSignIn,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
