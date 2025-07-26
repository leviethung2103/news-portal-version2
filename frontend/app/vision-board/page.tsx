import { Suspense } from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import VisionBoard from "@/components/vision-board"
import LoadingSpinner from "@/components/loading-spinner"
import { NewsProvider } from "@/components/news-provider"
import AuthWrapper from "@/components/auth-wrapper"

export default function VisionBoardPage() {
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
                  <VisionBoard />
                </Suspense>
              </div>
            </main>
          </div>
        </NewsProvider>
      </div>
    </AuthWrapper>
  )
}
