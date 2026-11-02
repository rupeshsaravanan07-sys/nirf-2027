"use client"

import * as React from "react"
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Loader2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Info,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import type { ImportPreview } from "@/lib/excel-import"

export default function ExcelImportPage() {
  const { toast } = useToast()

  const [file, setFile] = React.useState<File | null>(null)
  const [parsing, setParsing] = React.useState(false)
  const [preview, setPreview] = React.useState<ImportPreview | null>(null)
  const [committing, setCommitting] = React.useState(false)
  const [commitResult, setCommitResult] = React.useState<any>(null)
  const [dragActive, setDragActive] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setParsing(true)
    setPreview(null)
    setCommitResult(null)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await fetch("/api/admin/import/preview", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to parse workbook")

      setPreview(data)
      toast({
        title: "Workbook Analyzed",
        description: `Found ${data.total_students} students and ${data.total_responses} responses.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Import Parsing Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setParsing(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!preview) return
    setCommitting(true)

    try {
      const res = await fetch("/api/admin/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview,
          uploadedBy: "NIRF Admin Staff",
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to commit import")

      setCommitResult(data)
      toast({
        title: "Import Committed Successfully!",
        description: data.message,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Commit Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Excel Workbook Import & Re-Sync
          </h1>
          <p className="text-sm text-slate-500">
            Upload institutional Excel workbooks with automatic column detection, duplicate handling, and conflict preview.
          </p>
        </div>

        <a href="/NIRF_2027_Responses.xlsx" download="NIRF_2027_Master_Workbook.xlsx">
          <Button variant="outline" size="sm" className="text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Download Source Workbook Template
          </Button>
        </a>
      </div>

      {/* Upload Zone */}
      {!preview && !commitResult && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-blue-600" />
              Upload Source Excel Workbook
            </CardTitle>
            <CardDescription>
              Expected sheets: <code>Student list</code>, <code>Eligible Students</code>, <code>Form Responses 1</code>.
              The parser dynamically normalizes column headers with embedded spaces or newlines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
              }`}
            >
              <input
                type="file"
                id="excelFile"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="excelFile" className="cursor-pointer space-y-3 block">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                  {parsing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    {parsing ? "Parsing and Analyzing Workbook..." : "Drag and drop workbook here, or click to browse"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports .xlsx workbooks (up to 50MB, 900+ students)
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Commitment Banner */}
      {commitResult && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
              Workbook Imported Successfully!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {commitResult.message}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreview(null)
                setCommitResult(null)
                setFile(null)
              }}
            >
              Upload Another File
            </Button>
            <a href="/admin/students">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                View Updated Student Directory
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </a>
          </div>
        </Card>
      )}

      {/* Import Preview & Conflict Analysis */}
      {preview && !commitResult && (
        <div className="space-y-6">
          <Card className="border-blue-200 dark:border-blue-900 shadow-md">
            <CardHeader className="bg-blue-50/60 dark:bg-blue-950/40 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>Import Preview & Validation Summary</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {preview.filename}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Review detected student counts, response matching, and data integrity before committing to database.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreview(null)
                      setFile(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={committing}
                    onClick={handleConfirmImport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {committing ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Committing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Confirm & Import Records
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Stats Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                  <span className="text-xs text-slate-500 block">Total Students</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {preview.total_students}
                  </span>
                  <span className="text-[10px] text-slate-400 block">From Student List</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                  <span className="text-xs text-slate-500 block">Eligible Students</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {preview.eligible_count}
                  </span>
                  <span className="text-[10px] text-slate-400 block">In Eligible Sheet</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                  <span className="text-xs text-slate-500 block">Matched Responses</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {preview.matched_responses_count}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Matched by Register No</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                  <span className="text-xs text-slate-500 block">Unmatched Responses</span>
                  <span className="text-2xl font-bold text-amber-600">
                    {preview.unmatched_responses_count}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Not in Student List</span>
                </div>
              </div>

              {/* Warning on Unmatched Responses if any */}
              {preview.unmatched_responses_count > 0 && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Unmatched Responses Detected ({preview.unmatched_responses_count})</AlertTitle>
                  <AlertDescription className="text-xs space-y-2">
                    <p>
                      These responses exist in the Form Responses sheet, but their Register Number is not listed in the Master Student List. They will be safely preserved in the <code>original_responses</code> archive table without data loss.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {preview.unmatched_responses.slice(0, 10).map((r) => (
                        <span key={r.register_number} className="font-mono bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded text-[11px]">
                          {r.register_number} ({r.student_name || 'No Name'})
                        </span>
                      ))}
                      {preview.unmatched_responses.length > 10 && (
                        <span className="text-slate-500 self-center">
                          +{preview.unmatched_responses.length - 10} more
                        </span>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Duplicate Register Numbers Check */}
              {preview.duplicate_register_numbers.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Duplicate Register Numbers in Master List</AlertTitle>
                  <AlertDescription className="text-xs">
                    Found {preview.duplicate_register_numbers.length} duplicates. The import engine will deduplicate by normalized Register Number so that records are updated rather than duplicated.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>No duplicate Register Numbers detected in the master list. All student keys are unique.</span>
                </div>
              )}

              {/* Multiple Responses per Student Notice */}
              {preview.multi_response_students.length > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1 border">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Multiple Submissions ({preview.multi_response_students.length} students):
                  </p>
                  <p className="text-slate-500">
                    All original historical submissions are preserved in the archive. The latest response is used for current progression metrics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
