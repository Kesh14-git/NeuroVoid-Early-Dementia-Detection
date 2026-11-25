"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { AssessmentProvider } from "@/lib/assessment-context"
import { LoginPage } from "@/components/login-page"
import { AppShell } from "@/components/app-shell"

function AppContent() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AssessmentProvider>
      <AppShell />
    </AssessmentProvider>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
