"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface GoogleSignInProps {
  onSuccess: (user: any) => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    google: any
    handleCredentialResponse: (response: any) => void
  }
}

export default function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (document.getElementById("google-identity-script")) {
        initializeGoogle()
        return
      }

      const script = document.createElement("script")
      script.id = "google-identity-script"
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = initializeGoogle
      script.onerror = () => {
        console.error("Failed to load Google Identity Services")
        onError("Failed to load Google Sign-In")
      }
      document.head.appendChild(script)
    }

    const initializeGoogle = () => {
      if (!window.google || isInitialized.current) return

      try {
        // Define the callback function globally
        window.handleCredentialResponse = (response: any) => {
          try {
            // Decode the JWT token to get user info
            const payload = JSON.parse(atob(response.credential.split(".")[1]))

            const user = {
              name: payload.name,
              email: payload.email,
              picture: payload.picture,
              credential: response.credential,
            }

            onSuccess(user)
          } catch (error) {
            console.error("Error processing Google sign-in:", error)
            onError("Failed to process Google sign-in")
          }
        }

        // Initialize Google Identity Services with updated configuration
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id",
          callback: window.handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // Disable FedCM to avoid the error
        })

        // Render the Google Sign-In button with updated configuration
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
          })
        }

        setIsGoogleLoaded(true)
        isInitialized.current = true
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error)
        onError("Failed to initialize Google Sign-In")
      }
    }

    loadGoogleScript()

    return () => {
      // Cleanup
      if (window.handleCredentialResponse) {
        delete window.handleCredentialResponse
      }
    }
  }, [onSuccess, onError])

  const handleCustomGoogleSignIn = () => {
    if (window.google && isGoogleLoaded) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup if prompt fails
            handlePopupSignIn()
          }
        })
      } catch (error) {
        console.error("Error with Google prompt:", error)
        handlePopupSignIn()
      }
    } else {
      onError("Google Sign-In is not available")
    }
  }

  const handlePopupSignIn = () => {
    if (window.google) {
      try {
        // Use OAuth2 popup as fallback
        window.google.accounts.oauth2
          .initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id",
            scope: "openid email profile",
            callback: (response: any) => {
              if (response.access_token) {
                // Fetch user info using the access token
                fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
                  .then((res) => res.json())
                  .then((userInfo) => {
                    const user = {
                      name: userInfo.name,
                      email: userInfo.email,
                      picture: userInfo.picture,
                      credential: response.access_token,
                    }
                    onSuccess(user)
                  })
                  .catch((error) => {
                    console.error("Error fetching user info:", error)
                    onError("Failed to get user information")
                  })
              }
            },
          })
          .requestAccessToken()
      } catch (error) {
        console.error("Error with popup sign-in:", error)
        onError("Google Sign-In popup failed")
      }
    }
  }

  const [showFallback, setShowFallback] = useState(false);

  // Try to render Google button, if fails, show fallback
  useEffect(() => {
    // If googleButtonRef is not filled after a short delay, show fallback
    const timeout = setTimeout(() => {
      if (googleButtonRef.current && googleButtonRef.current.childElementCount === 0) {
        setShowFallback(true);
      }
    }, 1000); // 1s delay for Google to render
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="space-y-3">
      {/* Google's rendered button */}
      <div ref={googleButtonRef} className="w-full" />
      {showFallback && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 bg-transparent"
          onClick={handleCustomGoogleSignIn}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      )}
    </div>
  )
}
