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
              <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <div className="animate-fade-in">
                    <HeroSection />
                  </div>
                </Suspense>
                <div className="mt-6 sm:mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 animate-slide-in-up">Latest News</h2>
                  <Suspense fallback={<LoadingSpinner />}>
                    <div className="animate-slide-in-up delay-200">
                      <NewsGrid />
                    </div>
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
