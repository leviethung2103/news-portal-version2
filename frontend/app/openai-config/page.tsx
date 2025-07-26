'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Bot } from 'lucide-react'
import Header from '@/components/header'
import Sidebar from '@/components/sidebar'
import AuthWrapper from '@/components/auth-wrapper'
import { NewsProvider } from '@/components/news-provider'

export default function OpenAIConfigPage() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [keyLoaded, setKeyLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const storedKey = localStorage.getItem('OPENAI_API_KEY') || ''
    setApiKey(storedKey)
    setKeyLoaded(true)
  }, [])

/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Handles the submission of the form by saving the OpenAI API key
   * to local storage and displaying a success toast message.
   *

/*******  87d354c4-113a-4dd0-95bd-43daf568dd70  *******/
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      localStorage.setItem('OPENAI_API_KEY', apiKey)
      toast({
        title: 'API Key Saved',
        description: 'Your OpenAI API key has been saved successfully.',
        variant: 'success',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen bg-background">
        <NewsProvider>
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 lg:ml-64">
              <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-center gap-2 mb-6">
                  <Bot className="h-6 w-6" />
                  <h1 className="text-3xl font-bold">OpenAI Config</h1>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Configure OpenAI API Key</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                        <div className="relative flex items-center">
                          <Input
                            id="openai-api-key"
                            type={showKey ? 'text' : 'password'}
                            placeholder={keyLoaded && apiKey ? '••••••••' : 'Enter your OpenAI API Key'}
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            required
                            autoComplete="off"
                            aria-label="OpenAI API Key"
                          />
                          {keyLoaded && apiKey && (
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-primary focus:outline-none"
                              onClick={() => setShowKey(v => !v)}
                              tabIndex={0}
                              aria-label={showKey ? 'Hide API Key' : 'Show API Key'}
                            >
                              {showKey ? 'Hide' : 'Show'}
                            </button>
                          )}
                        </div>
                      </div>
                      <Button type="submit" disabled={loading || !apiKey} className="w-full sm:w-auto">
                        {loading ? 'Saving...' : 'Save API Key'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </NewsProvider>
      </div>
    </AuthWrapper>
  )
}
