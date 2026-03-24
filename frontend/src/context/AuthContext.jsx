import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const name  = localStorage.getItem('name')
    const role  = localStorage.getItem('role')
    if (token) setUser({ token, name, role })
  }, [])

  const login = (token, name, role) => {
    localStorage.setItem('token', token)
    localStorage.setItem('name', name)
    localStorage.setItem('role', role)
    setUser({ token, name, role })
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
