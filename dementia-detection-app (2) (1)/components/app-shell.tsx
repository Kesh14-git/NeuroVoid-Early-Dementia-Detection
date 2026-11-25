"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAssessment } from "@/lib/assessment-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Brain,
  LayoutDashboard,
  Mic,
  Gamepad2,
  PenTool,
  FileText,
  LogOut,
  Menu,
  X,
  ScanLine,
  ChevronRight,
  Sparkles,
  Shield,
  MessageCircle,
} from "lucide-react"
import { DashboardView } from "@/components/dashboard-view"
import { SpeechAnalysis } from "@/components/speech-analysis"
import { CognitiveTests } from "@/components/cognitive-tests"
import { DrawingTest } from "@/components/drawing-test"
import { MriAnalyzer } from "@/components/mri-analyzer"
import { ReportGenerator } from "@/components/report-generator"
import { ChatView } from "@/components/chat-view"

type View = "dashboard" | "speech" | "cognitive" | "drawing" | "mri" | "report" | "chatbot"

const NAV_ITEMS: { id: View; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "speech", label: "Speech Analysis", icon: Mic },
  { id: "cognitive", label: "Cognitive Tests", icon: Gamepad2 },
  { id: "drawing", label: "Drawing Test", icon: PenTool },
  { id: "mri", label: "MRI Analyzer", icon: ScanLine },
  { id: "report", label: "Reports", icon: FileText },
  { id: "chatbot", label: "AI Chatbot", icon: MessageCircle },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const { currentSpeech, currentCognitive, currentDrawing, currentMri } = useAssessment()
  const [view, setView] = useState<View>("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U"

  // Which tests are completed this session
  const completionMap: Record<string, boolean> = {
    speech: !!currentSpeech,
    cognitive: !!currentCognitive,
    drawing: !!currentDrawing,
    mri: !!currentMri,
  }

  const completedCount = Object.values(completionMap).filter(Boolean).length

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <Brain className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">NeuroSense</span>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">AI Cognitive Health</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Assessment
          </p>
          {NAV_ITEMS.slice(0, 1).map((item) => {
            const Icon = item.icon
            const isActive = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
            )
          })}

          <Separator className="my-2 bg-sidebar-border" />

          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Tests
          </p>
          {NAV_ITEMS.slice(1, 5).map((item) => {
            const Icon = item.icon
            const isActive = view === item.id
            const isCompleted = completionMap[item.id]
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {isCompleted && (
                  <Badge className="h-5 bg-success/20 px-1.5 text-[10px] text-success">Done</Badge>
                )}
                {isActive && !isCompleted && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
            )
          })}

          <Separator className="my-2 bg-sidebar-border" />

          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Analysis
          </p>
          {NAV_ITEMS.slice(5).map((item) => {
            const Icon = item.icon
            const isActive = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
            )
          })}

          {/* AI Powered Badge */}
          <div className="mt-auto rounded-xl bg-sidebar-accent/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground">
              <Sparkles className="h-4 w-4 text-sidebar-primary" />
              Gemini AI Powered
            </div>
            <p className="mt-1 text-xs text-sidebar-foreground/60">
              All assessments analyzed by Google Gemini for clinical-grade insights.
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-sidebar-foreground/50">
              <Shield className="h-3 w-3" />
              HIPAA Compliant
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{user?.name}</p>
              <p className="truncate text-xs capitalize text-sidebar-foreground/50">
                {user?.role} {completedCount > 0 && `- ${completedCount}/4 tests`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">NeuroSense</span>
          </div>
          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <Badge className="bg-primary/10 text-primary text-xs">{completedCount}/4</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="absolute inset-x-0 top-14 z-50 border-b border-border bg-card p-4 shadow-lg lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = view === item.id
                const isCompleted = completionMap[item.id]
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isCompleted && (
                      <Badge className="h-5 bg-success/20 px-1.5 text-[10px] text-success">Done</Badge>
                    )}
                  </button>
                )
              })}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {view === "dashboard" && <DashboardView />}
          {view === "speech" && <SpeechAnalysis />}
          {view === "cognitive" && <CognitiveTests />}
          {view === "drawing" && <DrawingTest />}
          {view === "mri" && <MriAnalyzer />}
          {view === "report" && <ReportGenerator />}
          {view === "chatbot" && <ChatView />}
        </main>
      </div>
    </div>
  )
}
