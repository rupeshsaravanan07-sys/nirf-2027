"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, GraduationCap, ArrowRight, Loader2, KeyRound } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/admin'

  const [email, setEmail] = React.useState('admin@vit.ac.in')
  const [password, setPassword] = React.useState('admin123')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      router.push(redirectTo)
    } catch (err: any) {
      setError(err.message || 'Login error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          Staff & Administrator Login
        </CardTitle>
        <CardDescription>
          Sign in with institutional credentials to access the NIRF verification dashboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Official Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@vit.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Administrator Credentials:
            </p>
            <p>Email: <span className="font-mono font-medium">admin@vit.ac.in</span></p>
            <p>Password: <span className="font-mono font-medium">admin123</span></p>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Access Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20 mb-2">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            NIRF 2027 Data Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Student Progression Data Collection & Verification Management
          </p>
        </div>

        <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
          <LoginForm />
        </React.Suspense>

        <div className="text-center text-xs text-slate-500">
          <p>Protected Academic Portal • Vellore Institute of Technology • SCOPE</p>
        </div>
      </div>
    </div>
  )
}
