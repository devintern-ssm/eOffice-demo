import React, { createContext, useContext, useEffect, useState } from 'react'
import { getToken, clearToken } from '../api/client'
import { login as apiLogin, me } from '../api/auth'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const onUnauth = () => setUser(null)
    window.addEventListener('eoffice-unauth', onUnauth)
    const t = getToken()
    if (t) {
      me().then(setUser).catch(() => clearToken()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => window.removeEventListener('eoffice-unauth', onUnauth)
  }, [])

  const login = async (email, password) => {
    const u = await apiLogin(email, password)
    setUser(u)
    return u
  }
  const logout = () => { clearToken(); setUser(null) }

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
