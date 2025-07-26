import LoginForm from "@/components/login-form"
import AuthWrapper from "@/components/auth-wrapper"

export default function LoginPage() {
  return (
    <AuthWrapper requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </AuthWrapper>
  )
}
