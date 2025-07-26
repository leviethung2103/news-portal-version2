import { NextResponse } from "next/server"

export async function GET() {
  // Mock featured article
  const featuredArticle = {
    id: "1",
    title: "Revolutionary AI Technology Transforms Healthcare Industry",
    description:
      "New artificial intelligence breakthrough promises to revolutionize patient care and medical diagnosis with unprecedented accuracy.",
    content:
      "A groundbreaking AI system has been developed that can diagnose diseases with 99% accuracy, potentially saving millions of lives and reducing healthcare costs globally.",
    imageUrl: "/placeholder.svg?height=500&width=800",
    category: "General",
    source: "TechNews Today",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readTime: "3 min read",
    trending: false,
    featured: true,
  }

  return NextResponse.json(featuredArticle)
}
