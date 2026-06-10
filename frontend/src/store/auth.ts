import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { name: string; email: string; role: string }

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('tw_token', token)
        }
        set({ user, token })
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tw_token')
        }
        set({ user: null, token: null })
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },
    }),
    { name: 'tw-auth', skipHydration: true }
  )
)
