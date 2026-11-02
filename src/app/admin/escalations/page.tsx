"use client"

import * as React from "react"
import {
  AlertTriangle,
  ShieldAlert,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  UserX,
  RefreshCw,
  MessageSquare,
  Edit3,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import type { FollowUpStatus } from "@/types/database"

export default function ProctorEscalationsPage() {
  const { toast } = useToast()

  const [escalations, setEscalations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('all')

  // Edit / Follow-up modal
  const [activeEscalation, setActiveEscalation] = React.useState<any>(null)
  const [followUpStatus, setFollowUpStatus] = React.useState<FollowUpStatus>('contacted')
  const [notes, setNotes] = React.useState('')
  const [updating, setUpdating] = React.useState(false)

  const fetchEscalations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/escalations?status=${statusFilter}`)
      const data = await res.json()
      if (res.ok) {
        setEscalations(data.escalations || [])
      }
    } catch (err) {
      console.error('Error fetching escalations:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchEscalations()
  }, [statusFilter])

  const handleUpdateEscalation = async () => {
    if (!activeEscalation) return
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalation_id: activeEscalation.id,
          follow_up_status: followUpStatus,
          notes,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: "Escalation Updated",
          description: data.message,
          variant: "success",
        })
        setActiveEscalation(null)
        fetchEscalations()
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
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Faculty Proctor Escalation Desk
            </h1>
            <Badge variant="destructive" className="text-xs">
              Action Required
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Cases routed to assigned faculty mentors after 3 unanswered reminders. Proctors initiate personal contact to verify progression status.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchEscalations}
          disabled={loading}
          className="text-xs self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold uppercase pr-1 shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Status:
          </span>
          {[
            { id: 'all', label: 'All Escalations' },
            { id: 'pending', label: 'Pending Action' },
            { id: 'contacted', label: 'Proctor Contacted' },
            { id: 'resolved', label: 'Resolved / Submitted' },
            { id: 'no_response', label: 'No Response' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Escalations Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr className="text-slate-500 font-semibold text-left">
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Assigned Proctor</th>
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Reminders</th>
                  <th className="py-3 px-4">Follow-up Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-rose-600" />
                      Loading escalations...
                    </td>
                  </tr>
                ) : escalations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No proctor escalations found under &quot;{statusFilter.replace(/_/g, ' ')}&quot;. Students are escalated here automatically after 3 confirmed reminders without response.
                    </td>
                  </tr>
                ) : (
                  escalations.map((esc) => {
                    const student = esc.student
                    return (
                      <tr key={esc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {student?.register_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {student?.student_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {student?.mobile_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {esc.proctor_name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {esc.proctor_employee_id || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="destructive" className="font-mono text-[10px]">
                            {esc.reminder_count} Sent
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              esc.follow_up_status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : esc.follow_up_status === 'contacted'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {esc.follow_up_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate text-slate-500 italic">
                          {esc.follow_up_notes || 'No follow-up notes logged yet.'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => {
                              setActiveEscalation(esc)
                              setFollowUpStatus(esc.follow_up_status)
                              setNotes(esc.follow_up_notes || '')
                            }}
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Log Follow-up
                          </Button>
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

      {/* Log Follow-up Dialog */}
      <Dialog open={!!activeEscalation} onOpenChange={(open) => !open && setActiveEscalation(null)}>
        <DialogContent className="max-w-md">
          {activeEscalation && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Proctor Mentorship Follow-up
                </DialogTitle>
                <DialogDescription>
                  Student: {activeEscalation.student?.student_name} ({activeEscalation.student?.register_number})
                </DialogDescription>
              </DialogHeader>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1 border">
                <p><span className="text-slate-400">Assigned Proctor:</span> <span className="font-semibold">{activeEscalation.proctor_name}</span></p>
                <p><span className="text-slate-400">Proctor Emp ID:</span> <span className="font-mono">{activeEscalation.proctor_employee_id}</span></p>
                <p><span className="text-slate-400">Student Mobile:</span> <span className="font-mono">{activeEscalation.student?.mobile_number}</span></p>
              </div>

              <div className="space-y-2">
                <Label>Follow-up Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'contacted', label: 'Contacted' },
                    { id: 'resolved', label: 'Resolved' },
                    { id: 'no_response', label: 'Unreachable' },
                  ].map((s) => (
                    <Button
                      key={s.id}
                      type="button"
                      size="sm"
                      variant={followUpStatus === s.id ? 'default' : 'outline'}
                      className="text-xs h-8"
                      onClick={() => setFollowUpStatus(s.id as FollowUpStatus)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="esc_notes">Proctor Discussion Notes</Label>
                <Input
                  id="esc_notes"
                  placeholder="e.g. Proctor called student; student placed at Infosys, sending offer letter..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveEscalation(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updating}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  onClick={handleUpdateEscalation}
                >
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Save Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
