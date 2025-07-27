import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json({ message: "Username, email, and password are required" }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address" }, { status: 400 })
    }

    // Use the working signup endpoint
    const signupResponse = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    })

    const signupData = await signupResponse.json()

    if (!signupResponse.ok) {
      return NextResponse.json(
        { message: signupData.detail || signupData.message || "Failed to create account" },
        { status: signupResponse.status }
      )
    }

    // Return the response from the backend
    return NextResponse.json({
      message: "Account created successfully",
      user: signupData.user,
      token: signupData.access_token,
    })
  } catch (error) {
    console.error("Signup error:", error)
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          message: "Unable to connect to authentication server. Please ensure the backend is running.",
          details: "Connection failed to FastAPI backend"
        }, 
        { status: 503 }
      )
    }
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}