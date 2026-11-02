"use client"

import * as React from "react"
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Table as TableIcon,
  Building,
  GraduationCap,
  Calendar,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ReportsExportPage() {
  const [downloading, setDownloading] = React.useState(false)

  const handleDownload = () => {
    setDownloading(true)
    window.location.href = "/api/admin/students/export"
    setTimeout(() => setDownloading(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Institutional Reports & Data Export
        </h1>
        <p className="text-sm text-slate-500">
          Generate NIRF 2027 compliant downloadable Excel workbooks combining verified student data, historical responses, and proctor records.
        </p>
      </div>

      {/* Primary Export Card */}
      <Card className="border-blue-200 dark:border-blue-900 shadow-md">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-950/30 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                Comprehensive NIRF 2027 Progression Master Workbook
              </CardTitle>
              <CardDescription>
                Contains 3 formatted sheets: All Student Records, Department-wise Summaries, and Faculty Proctor Metrics.
              </CardDescription>
            </div>
            <Button
              size="lg"
              onClick={handleDownload}
              disabled={downloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0"
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Excel...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Excel Report (.xlsx)
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">What is included in this workbook?</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                <FileText className="h-4 w-4" />
                Sheet 1: All Students Progression
              </div>
              <p className="text-slate-500 leading-relaxed">
                Full 900+ student master list enriched with latest verified progression outcome, company/university, CTC, proof links, reminders count, and escalation flags.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <Building className="h-4 w-4" />
                Sheet 2: Department Summary
              </div>
              <p className="text-slate-500 leading-relaxed">
                Aggregate submission rates, total strength, completed submissions, and pending counts grouped by academic programme and specialization.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                <TableIcon className="h-4 w-4" />
                Sheet 3: Proctor Follow-up Report
              </div>
              <p className="text-slate-500 leading-relaxed">
                Detailed faculty compliance breakdown with Proctor Name, Employee ID, assigned cohort size, submissions received, and pending percentage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NIRF 2027 Progression Standards Reference */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            NIRF Parameter Criteria (Student Progression Guidelines)
          </CardTitle>
          <CardDescription>
            Official classification rules enforced by this system for national ranking compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Full-Time Employment (Placement):</strong> Counted for graduating students who have received formal appointment orders or campus/off-campus offer letters with confirmed compensation (CTC).
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Higher Education (Progression to Higher Studies):</strong> Graduating students admitted into post-graduate or doctoral programs in recognized national or international universities with admission letters.
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Internship vs Employment Distinction:</strong> Internships are tracked separately in their own database category and are not automatically classified as full-time employment unless verified by staff.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
