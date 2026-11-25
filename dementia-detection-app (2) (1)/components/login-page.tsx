"use client"

import { useState } from "react"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Brain, Shield, Activity, Mic, Gamepad2, PenTool, ScanLine, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function LoginPage() {
  const { login, register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regRole, setRegRole] = useState<UserRole>("patient")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(loginEmail, loginPassword)
      toast.success("Welcome back!")
    } catch {
      toast.error("Invalid credentials. Try demo accounts below.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await register(regName, regEmail, regPassword, regRole)
      toast.success("Account created successfully!")
    } catch {
      toast.error("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = async (email: string) => {
    setIsLoading(true)
    try {
      await login(email, "password")
      toast.success("Welcome back!")
    } catch {
      toast.error("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Hero */}
      <div className="hidden flex-1 flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Brain className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">NeuroSense</span>
        </div>

        <div className="max-w-md">
          <Badge className="mb-4 bg-sidebar-primary/20 text-sidebar-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>
          <h1 className="text-balance text-4xl font-bold leading-tight text-sidebar-foreground">
            Early-Stage Dementia Detection Platform
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-sidebar-foreground/70">
            Advanced cognitive health screening powered by Google Gemini AI. Combining speech analysis, cognitive tests, drawing assessment, and MRI analysis for comprehensive neurological evaluation.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: Mic, label: "Speech Analysis", desc: "Linguistic pattern AI" },
              { icon: Gamepad2, label: "Cognitive Tests", desc: "4 gamified assessments" },
              { icon: PenTool, label: "Drawing Test", desc: "Clock drawing analysis" },
              { icon: ScanLine, label: "MRI Analysis", desc: "Neuroimaging AI" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-lg bg-sidebar-accent/30 p-3">
                <f.icon className="mt-0.5 h-5 w-5 text-sidebar-primary" />
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{f.label}</p>
                  <p className="text-xs text-sidebar-foreground/50">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-sidebar-foreground/40">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            HIPAA Compliant
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Clinical Grade AI
          </div>
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            Gemini Powered
          </div>
        </div>
      </div>

      {/* Right Panel - Auth */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 lg:max-w-xl">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">NeuroSense</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Cognitive Health</p>
            </div>
          </div>

          {/* Desktop Welcome Text */}
          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-muted-foreground">Sign in to access your cognitive health dashboard</p>
          </div>

          {/* Auth Card */}
          <Card className="border-border/60 shadow-lg">
            <CardContent className="pt-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="login-email" className="text-base">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        className="h-12 text-base"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="login-password" className="text-base">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        className="h-12 text-base"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="h-12 text-base" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reg-name" className="text-base">Full Name</Label>
                      <Input id="reg-name" placeholder="Your full name" className="h-12 text-base" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reg-email" className="text-base">Email</Label>
                      <Input id="reg-email" type="email" placeholder="your@email.com" className="h-12 text-base" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reg-password" className="text-base">Password</Label>
                      <Input id="reg-password" type="password" placeholder="Create a password" className="h-12 text-base" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-base">Role</Label>
                      <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)}>
                        <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patient">Patient</SelectItem>
                          <SelectItem value="caregiver">Caregiver</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="h-12 text-base" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Login */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Demo Access</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="h-12 justify-start gap-3" onClick={() => quickLogin("patient@neurosense.com")} disabled={isLoading}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">P</div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">Margaret Thompson</div>
                  <div className="text-xs text-muted-foreground">Patient Account</div>
                </div>
              </Button>
              <Button variant="outline" className="h-12 justify-start gap-3" onClick={() => quickLogin("doctor@neurosense.com")} disabled={isLoading}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent-foreground">D</div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">Dr. Sarah Chen</div>
                  <div className="text-xs text-muted-foreground">Doctor Account</div>
                </div>
              </Button>
              <Button variant="outline" className="h-12 justify-start gap-3" onClick={() => quickLogin("caregiver@neurosense.com")} disabled={isLoading}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-sm font-bold text-warning-foreground">C</div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">James Thompson</div>
                  <div className="text-xs text-muted-foreground">Caregiver Account</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
