"use client"

import * as React from "react"
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  CheckSquare,
  Square,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { generateWhatsAppLink, formatMobileNumber } from "@/lib/utils"

export default function WhatsAppManagementPage() {
  const { toast } = useToast()

  const [reminders, setReminders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState('pending_review')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [approving, setApproving] = React.useState(false)

  // Preview / Edit modal
  const [activeReminder, setActiveReminder] = React.useState<any>(null)
  const [editText, setEditText] = React.useState('')
  const [staffNote, setStaffNote] = React.useState('')
  const [confirmingSent, setConfirmingSent] = React.useState(false)

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/whatsapp/messages?status=${statusFilter}`)
      const data = await res.json()
      if (res.ok) {
        setReminders(data.reminders || [])
        setSelectedIds(new Set())
      }
    } catch (err) {
      console.error('Error fetching reminders:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchReminders()
  }, [statusFilter])

  const handleGenerateBatch = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/whatsapp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: "Batch Reminders Generated",
          description: data.message,
          variant: "success",
        })
        setStatusFilter('pending_review')
        fetchReminders()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast({
        title: "Generation Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === reminders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(reminders.map((r) => r.id)))
    }
  }

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return
    setApproving(true)
    try {
      const res = await fetch('/api/admin/whatsapp/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_ids: Array.from(selectedIds),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: "Messages Approved",
          description: data.message,
          variant: "success",
        })
        fetchReminders()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast({
        title: "Approval Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setApproving(false)
    }
  }

  const handleOpenWhatsApp = (mobile: string, text: string) => {
    const url = generateWhatsAppLink(mobile, text)
    window.open(url, '_blank')
    toast({
      title: "WhatsApp Opened",
      description: "Chat window opened. Remember to confirm sending in the system once sent.",
      variant: "default",
    })
  }

  const handleConfirmSent = async (reminderId: string) => {
    setConfirmingSent(true)
    try {
      const res = await fetch('/api/admin/whatsapp/confirm-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_id: reminderId,
          notes: staffNote,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.escalated) {
          toast({
            title: "Student Escalated to Proctor!",
            description: data.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Dispatched & Confirmed",
            description: data.message,
            variant: "success",
          })
        }
        setActiveReminder(null)
        setStaffNote('')
        fetchReminders()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast({
        title: "Confirmation Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setConfirmingSent(false)
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Message Copied",
      description: "Personalized text copied to clipboard.",
      variant: "success",
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header & Workflow Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              WhatsApp Message Review & Dispatch Hub
            </h1>
            <Badge variant="outline" className="text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
              Staff-Controlled Delivery
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Generate personalized messages with secure individual form links, review and edit before approval, and track dispatch with proctor escalation safeguard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateBatch}
            disabled={generating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                Generate Pending Reminders
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReminders}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Safety & Compliance Rule Box */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          NIRF 2027 Verification Protocol & Safeguards:
        </p>
        <p>
          1. <strong>Strict Staff Review:</strong> Opening a WhatsApp chat via <code className="font-mono">wa.me</code> does not mark a message as sent. Staff must verify transmission and click &quot;Confirm Staff Sent&quot;.
        </p>
        <p>
          2. <strong>Automated Proctor Escalation:</strong> When a student reaches 3 successfully confirmed reminders without a response, the system automatically routes the case to their assigned faculty proctor.
        </p>
      </div>

      {/* Filter Tabs & Batch Approval Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {[
              { id: 'pending_review', label: 'Pending Review' },
              { id: 'approved', label: 'Approved & Ready to Send' },
              { id: 'sent', label: 'Sent & Dispatched' },
              { id: 'all', label: 'All Messages' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {statusFilter === 'pending_review' && reminders.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-8"
              >
                {selectedIds.size === reminders.length ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 mr-1" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5 mr-1" /> Select All ({reminders.length})
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleBatchApprove}
                disabled={selectedIds.size === 0 || approving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              >
                {approving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                Approve Selected ({selectedIds.size})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminders List Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr className="text-slate-500 font-semibold text-left">
                  {statusFilter === 'pending_review' && (
                    <th className="py-3 px-4 w-10">
                      <span className="sr-only">Select</span>
                    </th>
                  )}
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Proctor</th>
                  <th className="py-3 px-4">Reminder #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Message Preview</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading reminders...
                    </td>
                  </tr>
                ) : reminders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No reminders currently in &quot;{statusFilter.replace(/_/g, ' ')}&quot; state. Click &quot;Generate Pending Reminders&quot; to create a new batch.
                    </td>
                  </tr>
                ) : (
                  reminders.map((r) => {
                    const isSelected = selectedIds.has(r.id)
                    const student = r.student

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60 transition-colors">
                        {statusFilter === 'pending_review' && (
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(r.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {student?.register_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {student?.student_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {student?.mobile_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {student?.proctor_name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold">#{r.reminder_number}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.send_status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.send_status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.send_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[240px] truncate font-mono text-[11px] text-slate-500" title={r.message_text}>
                          {r.message_text}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => {
                              setActiveReminder(r)
                              setEditText(r.message_text)
                            }}
                          >
                            Preview / Action
                          </Button>

                          {r.send_status === 'approved' && student?.mobile_number && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleOpenWhatsApp(student.mobile_number, r.message_text)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open Chat
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Message Action / Preview Modal */}
      <Dialog open={!!activeReminder} onOpenChange={(open) => !open && setActiveReminder(null)}>
        <DialogContent className="max-w-2xl">
          {activeReminder && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center justify-between">
                  <span>Review WhatsApp Message</span>
                  <Badge variant="outline" className="font-mono text-xs uppercase">
                    Status: {activeReminder.send_status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Student: {activeReminder.student?.student_name} ({activeReminder.student?.register_number}) • Mobile: {activeReminder.student?.mobile_number}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="msg_text">Personalized Message Content</Label>
                <Textarea
                  id="msg_text"
                  rows={8}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff_notes">Staff Transmission Notes (Optional)</Label>
                <Input
                  id="staff_notes"
                  placeholder="e.g. Chat sent by Sarah, student confirmed receipt on call..."
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleCopyText(editText)}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy Message Text
                </Button>

                <div className="flex items-center gap-2">
                  {activeReminder.student?.mobile_number && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => handleOpenWhatsApp(activeReminder.student.mobile_number, editText)}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Open WhatsApp Chat
                    </Button>
                  )}

                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    disabled={confirmingSent}
                    onClick={() => handleConfirmSent(activeReminder.id)}
                  >
                    {confirmingSent ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    Confirm Staff Sent
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
