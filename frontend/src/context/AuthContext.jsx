"use client"

import { createContext, useContext, useState, useEffect } from "react"
import api from "../utils/api"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin") || "null"))

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token)
    } else {
      localStorage.removeItem("token")
    }
  }, [token])

  useEffect(() => {
    if (admin) {
      localStorage.setItem("admin", JSON.stringify(admin))
    } else {
      localStorage.removeItem("admin")
    }
  }, [admin])

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password })
    setToken(response.data.token)
    setAdmin(response.data.admin)
    return response.data
  }

  const register = async (username, email, password, name) => {
    const response = await api.post("/auth/register", { username, email, password, name })
    setToken(response.data.token)
    setAdmin(response.data.admin)
    return response.data
  }

  const logout = () => {
    setToken(null)
    setAdmin(null)
  }

  return <AuthContext.Provider value={{ token, admin, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
