import { Suspense } from "react"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import HeroSection from "@/components/hero-section"
import NewsGrid from "@/components/news-grid"
import LoadingSpinner from "@/components/loading-spinner"
import { NewsProvider } from "@/components/news-provider"

export default function HomePage() {
  // Redirect to login page as the entry point
  redirect("/login")

  return (
    <div className="min-h-screen bg-background">
      <NewsProvider>
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Suspense fallback={<LoadingSpinner />}>
                <HeroSection />
              </Suspense>
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Latest News</h2>
                <Suspense fallback={<LoadingSpinner />}>
                  <NewsGrid />
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </NewsProvider>
    </div>
  )
}
