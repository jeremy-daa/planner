'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { User } from '@prisma/client'
import { createContext, useContext, useEffect } from 'react'

const CurrentUserContext = createContext<{
  user: User | null
  setUser: (user: User) => void
  isLoaded: boolean
}>({ user: null, setUser: () => {}, isLoaded: false })

export function useCurrentUser() {
   return useContext(CurrentUserContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [user, setUserState] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
          try {
              setUserState(JSON.parse(stored))
          } catch (e) {
              console.error('Failed to parse stored user')
          }
      }
      setIsLoaded(true)
  }, [])

  const setUser = (u: User | null) => {
      setUserState(u)
      if (u) {
          localStorage.setItem('currentUser', JSON.stringify(u))
      } else {
          localStorage.removeItem('currentUser')
      }
  }
  
  // Prevent rendering children until check is done to avoid flicker, or just pass null
  
  return (
    <QueryClientProvider client={queryClient}>
        <CurrentUserContext.Provider value={{ user, setUser, isLoaded }}>
            {children}
        </CurrentUserContext.Provider>
    </QueryClientProvider>
  )
}
