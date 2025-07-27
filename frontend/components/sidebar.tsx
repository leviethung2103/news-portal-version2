"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Globe, X, Settings, Bot, FolderOpen } from "lucide-react"
import { useNews } from "@/components/news-provider"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

const categories = [
  { id: "all", name: "All News", icon: Globe },
]

export default function Sidebar() {
  const { selectedCategory, setSelectedCategory, sidebarOpen, toggleSidebar } = useNews()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform border-r bg-background transition-all duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-lg" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 lg:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 py-4">
              <div className="mb-4">
                <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">CATEGORIES</h3>
                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon
                    return (
                      <Button
                        key={category.id}
                        variant={(pathname === "/news" && selectedCategory === category.id) ? "secondary" : "ghost"}
                        className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm"
                        onClick={() => {
                          setSelectedCategory(category.id)
                          router.push("/news")
                          if (window.innerWidth < 1024) {
                            toggleSidebar()
                          }
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {category.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">PRODUCTIVITY</h3>
                <div className="space-y-1">
                  <Link href="/projects">
                    <Button variant={pathname === "/projects" ? "secondary" : "ghost"} className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Projects
                    </Button>
                  </Link>
                  <Link href="/vision-board">
                    <Button variant={pathname === "/vision-board" ? "secondary" : "ghost"} className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mr-2 h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Vision Board
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">AI ASSISTANT</h3>
                <div className="space-y-1">
                  <Link href="/chatbot">
                    <Button variant={pathname === "/chatbot" ? "secondary" : "ghost"} className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                      <Bot className="mr-2 h-4 w-4" />
                      AI Chatbot
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">SETTINGS</h3>
                <div className="space-y-1">
                  <Link href="/settings">
                    <Button variant={pathname === "/settings" ? "secondary" : "ghost"} className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                      <Settings className="mr-2 h-4 w-4" />
                      RSS Settings
                    </Button>
                  </Link>
                  <Link href="/openai-config">
                    <Button variant={pathname === "/openai-config" ? "secondary" : "ghost"} className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                      <Bot className="mr-2 h-4 w-4" />
                      OpenAI Config
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  )
}
