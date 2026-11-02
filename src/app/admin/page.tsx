"use client"

import * as React from "react"
import {
  Users,
  FileCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PhoneOff,
  Building2,
  TrendingUp,
  Download,
  MessageSquare,
  UploadCloud,
  ChevronRight,
  ShieldAlert,
  Loader2,
  GraduationCap,
  Briefcase,
  BookOpen,
  Rocket,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { DashboardStats, DepartmentStats, ProctorStats } from "@/types/database"

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [departments, setDepartments] = React.useState<DepartmentStats[]>([])
  const [proctors, setProctors] = React.useState<ProctorStats[]>([])
  const [outcomes, setOutcomes] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/dashboard/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats)
        setDepartments(data.departments || [])
        setProctors(data.proctors || [])
        setOutcomes(data.outcomes || [])
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  React.useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm">Loading NIRF 2027 Dashboard Metrics...</p>
      </div>
    )
  }

  const completionPct =
    stats && stats.total_students > 0
      ? Math.round((stats.total_submitted / stats.total_students) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              NIRF 2027 Progression Dashboard
            </h1>
            <Badge variant="outline" className="text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200">
              Live Verified Data
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Real-time monitoring of graduating batch progression, proctor compliance, and WhatsApp communication campaigns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={refreshing}
            className="text-xs"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <a href="/api/admin/students/export">
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Download Excel Report
            </Button>
          </a>

          <a href="/admin/whatsapp">
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              WhatsApp Reminders
            </Button>
          </a>
        </div>
      </div>

      {/* Completion Progress Bar Header */}
      <Card className="border-blue-100 dark:border-blue-900/60 shadow-sm bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Institutional Submission Target
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {stats?.total_submitted} of {stats?.total_students} Students Submitted ({completionPct}%)
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-black text-blue-600">{completionPct}%</span>
                <span className="text-xs text-slate-500 block">Overall Progress</span>
              </div>
            </div>
          </div>
          <Progress value={completionPct} className="h-3" />
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
            <span>Verified Responses: {stats?.verified}</span>
            <span>Pending Submissions: {stats?.total_pending}</span>
          </div>
        </CardContent>
      </Card>

      {/* 10 Required Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Total Students */}
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Students</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats?.total_students || 0}</p>
            <p className="text-[11px] text-slate-500">Full Graduating Batch</p>
          </CardContent>
        </Card>

        {/* 2. Total Submitted */}
        <Card className="shadow-sm hover:shadow transition-shadow border-emerald-100 dark:border-emerald-950">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Submitted</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                <FileCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600">
              {stats?.total_submitted || 0}
            </p>
            <p className="text-[11px] text-emerald-700/80 font-medium">{completionPct}% Batch Submitted</p>
          </CardContent>
        </Card>

        {/* 3. Total Pending */}
        <Card className="shadow-sm hover:shadow transition-shadow border-amber-100 dark:border-amber-950">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Pending</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-600">
              {stats?.total_pending || 0}
            </p>
            <p className="text-[11px] text-amber-700/80 font-medium">Follow-up Required</p>
          </CardContent>
        </Card>

        {/* 4. Verified */}
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Verified</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats?.verified || 0}</p>
            <p className="text-[11px] text-slate-500">Evidence Validated</p>
          </CardContent>
        </Card>

        {/* 5. Verification Pending */}
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Verification Pending</span>
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats?.verification_pending || 0}</p>
            <p className="text-[11px] text-slate-500">Proof Submitted</p>
          </CardContent>
        </Card>

        {/* 6. Follow-up Required */}
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Needs Review</span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats?.follow_up_required || 0}</p>
            <p className="text-[11px] text-slate-500">Rejected / Queries</p>
          </CardContent>
        </Card>

        {/* 7. Existing Imported Responses */}
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Imported Responses</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950">
                <FileCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats?.total_existing_responses || 0}</p>
            <p className="text-[11px] text-slate-500">Form Responses 1 Sheet</p>
          </CardContent>
        </Card>

        {/* 8. New Portal Submissions */}
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">New Submissions</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                <Rocket className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats?.total_new_submissions || 0}</p>
            <p className="text-[11px] text-slate-500">Online Portal Entries</p>
          </CardContent>
        </Card>

        {/* 9. Invalid / Missing Contacts */}
        <Card className="shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Invalid Contacts</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950">
                <PhoneOff className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats?.invalid_contacts || 0}</p>
            <p className="text-[11px] text-slate-500">Need Number Update</p>
          </CardContent>
        </Card>

        {/* 10. Proctor Escalations */}
        <Card className="shadow-sm hover:shadow transition-shadow border-rose-100 dark:border-rose-950">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Escalated to Proctor</span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-rose-600">
              {stats?.escalated_to_proctors || 0}
            </p>
            <p className="text-[11px] text-rose-700/80 font-medium">3 Reminders Unresponsive</p>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Distribution & Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outcome Category Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Progression Outcome Distribution</span>
              <Badge variant="outline" className="text-xs">NIRF Classification</Badge>
            </CardTitle>
            <CardDescription>
              Categorized student responses conforming to national reporting criteria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outcomes.map((item) => {
              const totalSub = stats?.total_submitted || 1
              const pct = Math.round((item.count / totalSub) * 100)
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                    <span className="font-mono text-slate-500">
                      {item.count} students ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Programme / Department Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Department & Programme Submission Status</span>
              <a href="/admin/students" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View Details <ChevronRight className="h-3 w-3" />
              </a>
            </CardTitle>
            <CardDescription>
              Progression progress across degrees and specializations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {departments.map((dept) => {
                const pct = dept.total > 0 ? Math.round((dept.submitted / dept.total) * 100) : 0
                return (
                  <div key={dept.department} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold truncate max-w-[260px]" title={dept.department}>
                        {dept.department}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {dept.submitted} / {dept.total} ({pct}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proctor Performance and Compliance Leaderboard */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Proctor Compliance & Follow-up Table</span>
            <a href="/admin/escalations" className="text-xs text-rose-600 hover:underline flex items-center gap-1">
              View Escalations ({stats?.escalated_to_proctors || 0}) <ChevronRight className="h-3 w-3" />
            </a>
          </CardTitle>
          <CardDescription>
            Submission completion rate tracked per faculty proctor assigned to graduating cohorts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-slate-500 font-semibold text-left">
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Proctor Name</th>
                  <th className="py-2.5 px-3 text-right">Assigned Students</th>
                  <th className="py-2.5 px-3 text-right">Submitted</th>
                  <th className="py-2.5 px-3 text-right">Pending</th>
                  <th className="py-2.5 px-3 text-right">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {proctors.slice(0, 8).map((p) => (
                  <tr key={p.proctor_employee_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {p.proctor_employee_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {p.proctor_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{p.total_students}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">
                      {p.submitted}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-medium">
                      {p.pending}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                        p.submission_percentage >= 70
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : p.submission_percentage >= 40
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {p.submission_percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {proctors.length > 8 && (
            <p className="text-xs text-slate-400 text-center mt-3">
              Showing top 8 of {proctors.length} faculty proctors. Complete dataset exportable via Excel Report.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
