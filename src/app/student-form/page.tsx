"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Rocket,
  Clock,
  HelpCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react"

type OutcomeCategory =
  | 'full_time_employment'
  | 'higher_studies'
  | 'entrepreneurship'
  | 'internship_only'
  | 'other_progression'
  | 'no_confirmed_outcome'

function StudentFormContent() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token')
  const { toast } = useToast()

  const [tokenInput, setTokenInput] = React.useState(tokenFromUrl || '')
  const [activeToken, setActiveToken] = React.useState<string | null>(tokenFromUrl)
  const [student, setStudent] = React.useState<any>(null)
  const [existingSubmission, setExistingSubmission] = React.useState<any>(null)
  const [fetching, setFetching] = React.useState(false)
  const [tokenError, setTokenError] = React.useState<string | null>(null)

  // Form State
  const [outcome, setOutcome] = React.useState<OutcomeCategory>('full_time_employment')

  // Employment fields
  const [companyName, setCompanyName] = React.useState('')
  const [jobDesignation, setJobDesignation] = React.useState('')
  const [employmentType, setEmploymentType] = React.useState<'full_time' | 'part_time' | 'contract'>('full_time')
  const [joiningDate, setJoiningDate] = React.useState('')
  const [annualCtc, setAnnualCtc] = React.useState('')
  const [placementType, setPlacementType] = React.useState<'on_campus' | 'off_campus'>('on_campus')

  // Higher studies fields
  const [institutionName, setInstitutionName] = React.useState('')
  const [programmeCourse, setProgrammeCourse] = React.useState('')
  const [admissionYear, setAdmissionYear] = React.useState('2026')
  const [country, setCountry] = React.useState('India')

  // Entrepreneurship fields
  const [businessName, setBusinessName] = React.useState('')
  const [natureOfBusiness, setNatureOfBusiness] = React.useState('')
  const [establishmentDate, setEstablishmentDate] = React.useState('')

  // Internship fields
  const [internshipCompany, setInternshipCompany] = React.useState('')
  const [internshipRole, setInternshipRole] = React.useState('')
  const [internshipDuration, setInternshipDuration] = React.useState('6 Months')
  const [internshipStipend, setInternshipStipend] = React.useState('')

  // Other / Not Placed fields
  const [explanation, setExplanation] = React.useState('')

  // File upload state
  const [evidencePath, setEvidencePath] = React.useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = React.useState(false)
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null)

  // Declaration
  const [declaration, setDeclaration] = React.useState(false)

  // Submission state
  const [submitting, setSubmitting] = React.useState(false)
  const [submittedRef, setSubmittedRef] = React.useState<string | null>(null)

  // Load student data when token is available
  React.useEffect(() => {
    if (activeToken) {
      loadStudentData(activeToken)
    }
  }, [activeToken])

  const loadStudentData = async (tok: string) => {
    setFetching(true)
    setTokenError(null)
    try {
      const res = await fetch(`/api/student/form/${tok}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Student record could not be found with this token')
      }
      setStudent(data.student)
      if (data.existing_submission) {
        setExistingSubmission(data.existing_submission)
        // Pre-fill existing submission data
        setOutcome(data.existing_submission.outcome_category)
        if (data.existing_submission.employment_details) {
          const emp = data.existing_submission.employment_details
          setCompanyName(emp.company_name || '')
          setJobDesignation(emp.job_designation || '')
          setJoiningDate(emp.joining_date || '')
          setAnnualCtc(emp.annual_ctc || '')
          setPlacementType(emp.placement_type || 'on_campus')
        }
        if (data.existing_submission.higher_studies_details) {
          const hs = data.existing_submission.higher_studies_details
          setInstitutionName(hs.institution_name || '')
          setProgrammeCourse(hs.programme_course || '')
          setAdmissionYear(hs.admission_year || '2026')
          setCountry(hs.country || 'India')
        }
        if (data.existing_submission.evidence_storage_path) {
          setEvidencePath(data.existing_submission.evidence_storage_path)
          setUploadedFileName('Supporting document already on file')
        }
      }
    } catch (err: any) {
      setTokenError(err.message)
      setStudent(null)
    } finally {
      setFetching(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('register_number', student?.register_number || 'evidence')

    try {
      const res = await fetch('/api/student/upload-evidence', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'File upload failed')
      setEvidencePath(data.file_path)
      setUploadedFileName(file.name)
      toast({
        title: "Proof Uploaded Successfully",
        description: `${file.name} attached as supporting documentation.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!declaration) {
      toast({
        title: "Declaration Required",
        description: "Please check the declaration box before submitting.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const payload: any = {
      form_access_token: activeToken,
      outcome_category: outcome,
      evidence_storage_path: evidencePath,
      declaration_accepted: true,
    }

    if (outcome === 'full_time_employment') {
      payload.employment_details = {
        company_name: companyName,
        job_designation: jobDesignation,
        employment_type: employmentType,
        joining_date: joiningDate,
        annual_ctc: annualCtc,
        placement_type: placementType,
      }
    } else if (outcome === 'higher_studies') {
      payload.higher_studies_details = {
        institution_name: institutionName,
        programme_course: programmeCourse,
        admission_year: admissionYear,
        country: country,
      }
    } else if (outcome === 'entrepreneurship') {
      payload.entrepreneurship_details = {
        business_name: businessName,
        nature_of_business: natureOfBusiness,
        establishment_date: establishmentDate,
      }
    } else if (outcome === 'internship_only') {
      payload.internship_details = {
        company_name: internshipCompany,
        internship_role: internshipRole,
        duration: internshipDuration,
        stipend: internshipStipend,
      }
    } else {
      payload.other_details = {
        explanation: explanation,
      }
    }

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setSubmittedRef(data.submission_reference)
      toast({
        title: "Submission Successful!",
        description: `Reference Number: ${data.submission_reference}`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4">
      <Toaster />
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <GraduationCap className="h-4 w-4" />
            National Institutional Ranking Framework (NIRF 2027)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Student Progression Verification Portal
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Please report or verify your graduation progression outcome (Employment, Higher Studies, Entrepreneurship, or Internship) for official ranking compilation.
          </p>
        </div>

        {/* Token Authentication if not already in URL */}
        {!student && !submittedRef && (
          <Card className="shadow-lg border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Access Your Progression Record
              </CardTitle>
              <CardDescription>
                Enter your Register Number (e.g. 21MIS1137) or the personal invitation token sent to your WhatsApp/email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tokenError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access Error</AlertTitle>
                  <AlertDescription>{tokenError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="token">Register Number or Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="token"
                    placeholder="Enter Register Number (e.g. 21MIS1137) or Access Token"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  <Button
                    onClick={() => setActiveToken(tokenInput.trim())}
                    disabled={!tokenInput.trim() || fetching}
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  >
                    {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Access Form'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-900 p-3 rounded-md space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Why do I need a token?</p>
                <p>
                  To protect your personal data privacy under institutional policy, student progression forms are secured using private individual tokens. You cannot view or modify any other student’s data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Screen */}
        {submittedRef && (
          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xl text-center p-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                Progression Details Recorded
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Thank you, <span className="font-semibold">{student?.student_name}</span>. Your details have been submitted to the NIRF ranking compilation committee for verification.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Submission Reference Number</p>
              <p className="text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                {submittedRef}
              </p>
              <p className="text-xs text-slate-500">
                Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmittedRef(null)
                  loadStudentData(activeToken!)
                }}
              >
                Review or Update Submission
              </Button>
            </div>
          </Card>
        )}

        {/* Main Progression Form */}
        {student && !submittedRef && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Verified Details Card */}
            <Card className="border-blue-100 dark:border-blue-900 shadow-md">
              <CardHeader className="bg-slate-100/60 dark:bg-slate-900/60 rounded-t-lg border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>{student.student_name}</span>
                      <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
                        {student.register_number}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{student.programme || student.department}</CardDescription>
                  </div>
                  <Badge variant="success" className="h-6">
                    Verified Student
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">School / Department</span>
                  <span className="font-medium">{student.department || 'SCOPE'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Registered Email</span>
                  <span className="font-medium">{student.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Registered Mobile</span>
                  <span className="font-medium">{student.mobile_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">NIRF Batch</span>
                  <span className="font-medium">Graduating Class of 2026-2027</span>
                </div>
              </CardContent>
            </Card>

            {/* Existing Submission Banner if updating */}
            {existingSubmission && (
              <Alert variant="info" className="border-sky-300 bg-sky-50 dark:bg-sky-950/30">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sky-900 dark:text-sky-200 font-semibold">
                  Existing Submission on File (Version {existingSubmission.submission_version})
                </AlertTitle>
                <AlertDescription className="text-sky-800 dark:text-sky-300 text-xs">
                  Reference: <span className="font-mono font-medium">{existingSubmission.submission_reference}</span> • Verification Status: <span className="font-bold uppercase">{existingSubmission.verification_status}</span>. You may review and submit updated details below. A new version will be saved in your submission history without overwriting previous data.
                </AlertDescription>
              </Alert>
            )}

            {/* Progression Outcome Category Selector */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">1. Select Your Current Progression Outcome</CardTitle>
                <CardDescription>
                  Choose the option that accurately describes your primary post-graduation status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'full_time_employment',
                      label: 'Full-time Employment',
                      desc: 'Joined or received an offer letter for full-time job / placement',
                      icon: Briefcase,
                    },
                    {
                      id: 'higher_studies',
                      label: 'Higher Studies',
                      desc: 'Admitted into Masters, PhD, MBA or Post-graduate degree',
                      icon: BookOpen,
                    },
                    {
                      id: 'entrepreneurship',
                      label: 'Entrepreneurship',
                      desc: 'Founded a registered startup, business venture or freelance agency',
                      icon: Rocket,
                    },
                    {
                      id: 'internship_only',
                      label: 'Internship Only',
                      desc: 'Currently pursuing an internship (not yet converted to FTE)',
                      icon: Clock,
                    },
                    {
                      id: 'other_progression',
                      label: 'Other Progression',
                      desc: 'Fellowships, civil service prep, independent research',
                      icon: HelpCircle,
                    },
                    {
                      id: 'no_confirmed_outcome',
                      label: 'Preparing / Placement Search',
                      desc: 'Currently preparing for placements, entrance exams or interviews',
                      icon: Info,
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    const isSelected = outcome === item.id
                    return (
                      <div
                        key={item.id}
                        onClick={() => setOutcome(item.id as OutcomeCategory)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm leading-none">{item.label}</p>
                          <p className="text-xs text-slate-500 leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Conditional Detailed Fields */}
            {outcome === 'full_time_employment' && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company / Organization Name *</Label>
                      <Input
                        id="company"
                        placeholder="e.g. Tata Consultancy Services, Microsoft, Infosys"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Job Designation / Role *</Label>
                      <Input
                        id="designation"
                        placeholder="e.g. Software Engineer, Associate Analyst"
                        value={jobDesignation}
                        onChange={(e) => setJobDesignation(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Placement Mode *</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={placementType === 'on_campus' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setPlacementType('on_campus')}
                        >
                          On Campus
                        </Button>
                        <Button
                          type="button"
                          variant={placementType === 'off_campus' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setPlacementType('off_campus')}
                        >
                          Off Campus
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ctc">Annual CTC (INR / LPA)</Label>
                      <Input
                        id="ctc"
                        placeholder="e.g. 9.5 LPA or 950000"
                        value={annualCtc}
                        onChange={(e) => setAnnualCtc(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="joining">Joining Year / Month *</Label>
                      <Input
                        id="joining"
                        placeholder="e.g. July 2026"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {outcome === 'higher_studies' && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Higher Studies Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institution">University / Institution Name *</Label>
                      <Input
                        id="institution"
                        placeholder="e.g. Carnegie Mellon University, IIT Bombay"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="degree">Degree / Programme *</Label>
                      <Input
                        id="degree"
                        placeholder="e.g. MS in Computer Science, MBA"
                        value={programmeCourse}
                        onChange={(e) => setProgrammeCourse(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country of Institution *</Label>
                      <Input
                        id="country"
                        placeholder="e.g. India, USA, Germany, Ireland"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admission_year">Admission Year *</Label>
                      <Input
                        id="admission_year"
                        placeholder="2026"
                        value={admissionYear}
                        onChange={(e) => setAdmissionYear(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {outcome === 'entrepreneurship' && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-blue-600" />
                    Entrepreneurship & Business Venture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="biz_name">Business / Startup Name *</Label>
                      <Input
                        id="biz_name"
                        placeholder="e.g. Nexus AI Labs Pvt Ltd"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz_nature">Nature of Business *</Label>
                      <Input
                        id="biz_nature"
                        placeholder="e.g. SaaS, EdTech, Healthcare AI"
                        value={natureOfBusiness}
                        onChange={(e) => setNatureOfBusiness(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="est_date">Date or Year of Incorporation / Inception *</Label>
                    <Input
                      id="est_date"
                      placeholder="e.g. 2026"
                      value={establishmentDate}
                      onChange={(e) => setEstablishmentDate(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {outcome === 'internship_only' && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Internship Details
                  </CardTitle>
                  <CardDescription>
                    Note: Per NIRF definitions, internships are tracked distinctly and do not count as permanent full-time employment until converted.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="int_company">Company / Host Organization *</Label>
                      <Input
                        id="int_company"
                        placeholder="e.g. Bosch, Amazon, Cisco"
                        value={internshipCompany}
                        onChange={(e) => setInternshipCompany(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="int_role">Internship Role / Domain *</Label>
                      <Input
                        id="int_role"
                        placeholder="e.g. SDE Intern, Research Intern"
                        value={internshipRole}
                        onChange={(e) => setInternshipRole(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="int_duration">Duration *</Label>
                      <Input
                        id="int_duration"
                        placeholder="e.g. 6 Months, Jan - Jun 2026"
                        value={internshipDuration}
                        onChange={(e) => setInternshipDuration(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="int_stipend">Monthly Stipend (INR)</Label>
                      <Input
                        id="int_stipend"
                        placeholder="e.g. 35,000 / month"
                        value={internshipStipend}
                        onChange={(e) => setInternshipStipend(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(outcome === 'other_progression' || outcome === 'no_confirmed_outcome') && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    Additional Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="explanation">Provide Details / Current Focus *</Label>
                    <Textarea
                      id="explanation"
                      rows={4}
                      placeholder="e.g. Actively attending off-campus placement drives, preparing for GATE/CAT 2027, civil services, etc."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evidence Document Upload */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Supporting Evidence / Document Proof
                </CardTitle>
                <CardDescription>
                  Upload your Offer Letter, Admission Letter, Startup Registration, or Certificate (PDF, PNG, JPG up to 10MB).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="evidence"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="evidence" className="cursor-pointer space-y-2 block">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                      {uploadingFile ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {uploadingFile ? 'Uploading Document...' : 'Click to Upload Supporting Document'}
                      </p>
                      <p className="text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  </label>
                </div>

                {uploadedFileName && (
                  <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border text-slate-700 dark:text-slate-300">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-medium truncate flex-1">{uploadedFileName}</span>
                    <Badge variant="success" className="text-[10px]">Attached</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Declaration and Acceptance */}
            <Card className="shadow-md border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="decl"
                    checked={declaration}
                    onChange={(e) => setDeclaration(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="decl" className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="font-semibold block text-sm text-slate-900 dark:text-slate-100 mb-0.5">
                      Student Declaration & Truthfulness Notice
                    </span>
                    I hereby declare that all information furnished above regarding my employment, higher studies, or post-graduation status is true, accurate, and supported by valid institutional or corporate documentation. I understand this information will be utilized for NIRF 2027 official reporting.
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={submitting || !declaration}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Progression Data
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function StudentFormPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <StudentFormContent />
    </React.Suspense>
  )
}
