import { type NextRequest, NextResponse } from "next/server"

// Mock user database
const mockUsers = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    password: "password123", // In real app, this would be hashed
    name: "Admin User",
  },
  {
    id: "2",
    username: "user",
    email: "user@example.com",
    password: "password123",
    name: "Regular User",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    // Find user by username or email
    const user = mockUsers.find((u) => u.username === username || u.email === username)

    if (!user) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    // Check password (in real app, compare with hashed password)
    if (user.password !== password) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    // Generate mock JWT token (in real app, use proper JWT library)
    const token = `mock-jwt-token-${user.id}-${Date.now()}`

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
