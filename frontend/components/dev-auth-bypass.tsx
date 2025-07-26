"use client"
import { useEffect } from "react"

export default function DevAuthBypass() {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      if (!localStorage.getItem("user")) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: "admin",
            email: "devuser@example.com",
            picture: "",
            username: "password123"
          })
        )
      }
      if (!localStorage.getItem("token")) {
        localStorage.setItem("token", "dev-token")
      }
    }
  }, [])
  return null
}
