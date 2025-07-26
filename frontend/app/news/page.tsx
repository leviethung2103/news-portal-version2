import { Suspense } from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import HeroSection from "@/components/hero-section"
import NewsGrid from "@/components/news-grid"
import LoadingSpinner from "@/components/loading-spinner"
import { NewsProvider } from "@/components/news-provider"
import AuthWrapper from "@/components/auth-wrapper"

export default function NewsPage() {
  return (
    <AuthWrapper requireAuth={true}>
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
    </AuthWrapper>
  )
}
