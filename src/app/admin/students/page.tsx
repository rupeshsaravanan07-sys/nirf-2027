"use client"

import * as React from "react"
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  FileText,
  User,
  Building,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { generateWhatsAppLink, formatMobileNumber } from "@/lib/utils"

export default function StudentsDirectoryPage() {
  const { toast } = useToast()

  const [students, setStudents] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [page, setPage] = React.useState(1)

  // Filters
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('all')
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null)
  const [studentDetail, setStudentDetail] = React.useState<any>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)

  // Verification modal state
  const [verifyStatus, setVerifyStatus] = React.useState<'verified' | 'rejected' | 'needs_review'>('verified')
  const [adminNotes, setAdminNotes] = React.useState('')
  const [updatingVerify, setUpdatingVerify] = React.useState(false)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        status,
      })
      const res = await fetch(`/api/admin/students?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setStudents(data.students || [])
        setTotal(data.total || 0)
        setTotalPages(data.total_pages || 1)
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchStudents()
  }, [page, status])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchStudents()
  }

  const openStudentDetail = async (id: string) => {
    setSelectedStudentId(id)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/students/${id}`)
      const data = await res.json()
      if (res.ok) {
        setStudentDetail(data)
      }
    } catch (err) {
      console.error('Error fetching student detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleVerifySubmission = async (submissionId: string) => {
    setUpdatingVerify(true)
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          status: verifyStatus,
          admin_notes: adminNotes,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: "Status Updated",
          description: `Submission marked as ${verifyStatus}.`,
          variant: "success",
        })
        openStudentDetail(selectedStudentId!)
        fetchStudents()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingVerify(false)
    }
  }

  const copyStudentFormLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/student-form?token=${token}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link Copied!",
      description: "Individual student form link copied to clipboard.",
      variant: "success",
    })
  }

  return (
    <div className="space-y-6">
      {/* Title & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Progression Directory
          </h1>
          <p className="text-sm text-slate-500">
            Search, filter, review evidence, and track verification across all {total} graduating students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/admin/students/export">
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Export Directory (.xlsx)
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStudents}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Register No (e.g. 22BAI1452), Student Name, Mobile, or Proctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
              Search Directory
            </Button>
          </form>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-xs font-semibold uppercase pr-1 shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Students' },
              { id: 'submitted', label: 'Submitted' },
              { id: 'pending', label: 'Pending Submission' },
              { id: 'verified', label: 'Verified' },
              { id: 'pending_verification', label: 'Verification Pending' },
              { id: 'follow_up', label: 'Needs Review' },
              { id: 'reminder_1', label: 'Reminder 1' },
              { id: 'reminder_2', label: 'Reminder 2' },
              { id: 'reminder_3', label: 'Reminder 3+' },
              { id: 'escalated', label: 'Escalated to Proctor' },
            ].map((f) => {
              const active = status === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setStatus(f.id)
                    setPage(1)
                  }}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Students Data Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr className="text-slate-500 font-semibold text-left">
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Department / Programme</th>
                  <th className="py-3 px-4">Proctor</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Submission</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Reminders</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading student records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No students matched the active search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const hasSub = !!s.latest_submission
                    const sub = s.latest_submission
                    const isEscalated = !!s.escalation

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {s.register_number}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {s.student_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {s.mobile_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate" title={s.programme || s.department}>
                          <span className="font-semibold block">{s.department || 'SCOPE'}</span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {s.programme || 'B.Tech CSE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium block">{s.proctor_name || 'Unassigned'}</span>
                          <span className="text-[10px] font-mono text-slate-500">{s.proctor_employee_id || ''}</span>
                        </td>
                        <td className="py-3 px-4">
                          {hasSub ? (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
                              {sub.outcome_category.replace(/_/g, ' ')}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {hasSub ? (
                            <Badge variant="success" className="text-[10px]">Submitted</Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">Pending</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {hasSub ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                sub.verification_status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : sub.verification_status === 'pending'
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {sub.verification_status}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold">{s.reminder_count}</span>
                            {isEscalated && (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                                Escalated
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => openStudentDetail(s.id)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            title="Copy student form link"
                            onClick={() => copyStudentFormLink(s.form_access_token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 text-xs text-slate-500">
            <p>
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} students
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
                className="h-8 text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="h-8 text-xs"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      <Dialog open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailLoading || !studentDetail ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              Loading complete student profile and submission history...
            </div>
          ) : (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      <span>{studentDetail.student.student_name}</span>
                      <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700">
                        {studentDetail.student.register_number}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>
                      {studentDetail.student.programme || studentDetail.student.department}
                    </DialogDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => copyStudentFormLink(studentDetail.student.form_access_token)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy Form Link
                  </Button>
                </div>
              </DialogHeader>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border text-xs">
                <div>
                  <span className="text-slate-400 block">Mobile</span>
                  <span className="font-mono font-medium">{studentDetail.student.mobile_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="truncate block font-medium">{studentDetail.student.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Proctor</span>
                  <span className="font-medium">{studentDetail.student.proctor_name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Proctor Emp ID</span>
                  <span className="font-mono font-medium">{studentDetail.student.proctor_employee_id || 'N/A'}</span>
                </div>
              </div>

              {/* Submissions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Progression Submissions ({studentDetail.submissions.length})
                  </h4>
                </div>

                {studentDetail.submissions.length === 0 ? (
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Form Submission Yet</AlertTitle>
                    <AlertDescription>
                      Student has not completed their progression outcome form. Use the WhatsApp Reminders tool to prompt them.
                    </AlertDescription>
                  </Alert>
                ) : (
                  studentDetail.submissions.map((sub: any) => (
                    <Card key={sub.id} className="border-slate-200 dark:border-slate-800">
                      <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900 rounded-t-lg border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm capitalize">
                              {sub.outcome_category.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="outline" className="text-[10px]">Version {sub.submission_version}</Badge>
                            <span className="text-xs font-mono text-slate-500">Ref: {sub.submission_reference}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sub.verification_status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.verification_status === 'pending'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.verification_status}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs">
                        {/* Specific details rendering */}
                        {sub.employment_details && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div>
                              <span className="text-slate-400 block">Company:</span>
                              <span className="font-semibold">{sub.employment_details.company_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Role:</span>
                              <span className="font-semibold">{sub.employment_details.job_designation}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Annual CTC:</span>
                              <span className="font-semibold">{sub.employment_details.annual_ctc || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Placement Mode:</span>
                              <span className="font-semibold uppercase">{sub.employment_details.placement_type || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Joining Date:</span>
                              <span className="font-semibold">{sub.employment_details.joining_date}</span>
                            </div>
                          </div>
                        )}

                        {sub.higher_studies_details && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div>
                              <span className="text-slate-400 block">Institution:</span>
                              <span className="font-semibold">{sub.higher_studies_details.institution_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Degree / Course:</span>
                              <span className="font-semibold">{sub.higher_studies_details.programme_course}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Country:</span>
                              <span className="font-semibold">{sub.higher_studies_details.country}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Admission Year:</span>
                              <span className="font-semibold">{sub.higher_studies_details.admission_year}</span>
                            </div>
                          </div>
                        )}

                        {sub.evidence_storage_path && (
                          <div className="pt-2 border-t space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Supporting Evidence / Proof Document:</span>
                              <a
                                href={sub.evidence_storage_path}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open Full Document
                              </a>
                            </div>

                            {/* Inline Image Preview if file is an image */}
                            {(sub.evidence_storage_path.match(/\.(jpeg|jpg|png|webp|svg)($|\?)/i) ||
                              sub.evidence_storage_path.startsWith('/uploads/') ||
                              sub.evidence_storage_path.startsWith('data:image/')) && (
                              <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border flex flex-col items-start gap-1">
                                <span className="text-[10px] text-slate-500 font-mono">Document Preview:</span>
                                <div className="max-h-48 overflow-hidden rounded border bg-white dark:bg-slate-900 w-full flex justify-center">
                                  <img
                                    src={sub.evidence_storage_path}
                                    alt="Uploaded evidence"
                                    className="max-h-48 object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(sub.evidence_storage_path, '_blank')}
                                    onError={(e) => {
                                      // If it fails to load as an image (e.g. PDF), hide img tag gracefully
                                      (e.target as HTMLElement).style.display = 'none'
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Verification Action Panel */}
                        <div className="pt-3 border-t space-y-2">
                          <p className="font-bold text-slate-700 dark:text-slate-300">Staff Verification Decision:</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={verifyStatus === 'verified' ? 'default' : 'outline'}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => setVerifyStatus('verified')}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Verified
                            </Button>
                            <Button
                              size="sm"
                              variant={verifyStatus === 'needs_review' ? 'default' : 'outline'}
                              className="h-7 text-xs"
                              onClick={() => setVerifyStatus('needs_review')}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" /> Needs Review
                            </Button>
                            <Button
                              size="sm"
                              variant={verifyStatus === 'rejected' ? 'destructive' : 'outline'}
                              className="h-7 text-xs"
                              onClick={() => setVerifyStatus('rejected')}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Optional staff verification note..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="h-8 text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleVerifySubmission(sub.id)}
                              disabled={updatingVerify}
                              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                            >
                              {updatingVerify ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Status'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Reminders & Communication Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Send className="h-4 w-4 text-emerald-600" />
                  Communication & Reminder History ({studentDetail.reminders.length})
                </h4>
                {studentDetail.reminders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No reminders generated yet for this student.</p>
                ) : (
                  <div className="space-y-2">
                    {studentDetail.reminders.map((r: any) => (
                      <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Reminder #{r.reminder_number}
                          </span>
                          <Badge variant="outline" className="uppercase text-[9px] font-mono">
                            {r.send_status}
                          </Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-pre-wrap">
                          {r.message_text.substring(0, 150)}...
                        </p>
                        <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                          <span>Generated: {new Date(r.generated_at).toLocaleDateString()}</span>
                          {r.sent_at && <span>Sent: {new Date(r.sent_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
