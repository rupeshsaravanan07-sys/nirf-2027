"use client"

import * as React from "react"
import Link from "next/navigation"
import { usePathname, useRouter } from "next/navigation"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  MessageSquare,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "Students Directory", icon: Users },
    { href: "/admin/whatsapp", label: "WhatsApp Messaging", icon: MessageSquare },
    { href: "/admin/escalations", label: "Proctor Escalations", icon: AlertTriangle },
    { href: "/admin/import", label: "Excel Import", icon: UploadCloud },
    { href: "/admin/reports", label: "Reports & Export", icon: FileSpreadsheet },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Toaster />
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  NIRF 2027
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Student Progression
                </Badge>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                School of Computer Science and Engineering (SCOPE)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/student-form"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              Public Student Form
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-xs">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none text-slate-900 dark:text-slate-100">
                  Admin Officer
                </p>
                <p className="text-[10px] text-slate-500">NIRF Cell</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="text-slate-500 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800 flex overflow-x-auto gap-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </a>
            )
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500">
        <p>
          NIRF 2027 Student Progression Data Collection & Verification Management System • Built for 900+ Students Population
        </p>
      </footer>
    </div>
  )
}
