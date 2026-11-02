import Link from "next/link"
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Building,
  Clock,
  Sparkles,
  ChevronRight,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">NIRF 2027</span>
              <span className="text-xs text-slate-500 block">Student Progression System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <ShieldCheck className="h-4 w-4 mr-1.5 text-blue-600" />
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 flex flex-col justify-center text-center space-y-10">
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <Sparkles className="h-3.5 w-3.5" />
            Vellore Institute of Technology • SCOPE NIRF Cell
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Student Progression Data Collection & Management System
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Official institutional portal for gathering, verifying, and reporting post-graduation outcomes for the Graduating Class of 2026–2027 under NIRF reporting frameworks.
          </p>
        </div>

        {/* Two Main Cards: Student & Staff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto w-full">
          {/* Student Portal Card */}
          <Card className="border-2 border-blue-200 dark:border-blue-900/80 bg-white dark:bg-slate-900 shadow-xl hover:border-blue-500 transition-all">
            <CardContent className="p-8 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Graduating Students</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Submit or update your employment, higher studies, or entrepreneurial outcome. Upload your offer letter or admission proof securely.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/student-form" className="block">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Open Student Form
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-[11px] text-slate-400 text-center">
                  Access requires your individual private token from WhatsApp
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin / Staff Card */}
          <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl hover:border-slate-400 transition-all">
            <CardContent className="p-8 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Faculty & Administration</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Monitor live submission counts, verify student evidence, orchestrate WhatsApp reminder campaigns, and manage proctor escalations.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/admin" className="block">
                  <Button size="lg" variant="outline" className="w-full font-semibold border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Administrator Dashboard
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-[11px] text-slate-400 text-center">
                  Sign in with authorized institutional credentials
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 text-xs text-left">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border space-y-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-1" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">900+ Student Cohort</p>
            <p className="text-slate-400">Complete master list synchronization with 0 data loss.</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border space-y-1">
            <MessageSquare className="h-4 w-4 text-emerald-600 mb-1" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">WhatsApp Workflow</p>
            <p className="text-slate-400">Personalized templates, staff review, and wa.me dispatch.</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border space-y-1">
            <ShieldCheck className="h-4 w-4 text-blue-600 mb-1" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Proctor Escalation</p>
            <p className="text-slate-400">Automatic escalation to mentors after 3 sent reminders.</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border space-y-1">
            <FileSpreadsheet className="h-4 w-4 text-purple-600 mb-1" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Excel Export</p>
            <p className="text-slate-400">Multi-sheet NIRF reports with old and new verified data.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <p>NIRF 2027 Student Progression Management System • Secure Academic Portal</p>
      </footer>
    </div>
  )
}
