'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  X,
  FileText,
  Users,
  Eye,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Teacher } from '@/app/school/teachers/page'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onTeachersUploaded: (teachers: Teacher[]) => void
}

interface ParsedTeacher {
  row: number
  name?: string
  email?: string
  employeeId?: string
  phone?: string
  qualification?: string
  specialization?: string
  experience?: number
  address?: string
  hireDate?: string
  errors: string[]
  status: 'valid' | 'invalid' | 'duplicate'
}

interface UploadStep {
  id: number
  title: string
  description: string
  completed: boolean
}

const uploadSteps: UploadStep[] = [
  { id: 1, title: 'Upload File', description: 'Select and upload CSV/Excel file', completed: false },
  { id: 2, title: 'Map Columns', description: 'Map file columns to teacher fields', completed: false },
  { id: 3, title: 'Validate Data', description: 'Review and validate teacher data', completed: false },
  { id: 4, title: 'Import Teachers', description: 'Import validated teachers to system', completed: false },
]

const requiredFields = ['name', 'email', 'employeeId']
const optionalFields = ['phone', 'qualification', 'specialization', 'experience', 'address', 'hireDate']

export function BulkUploadModal({ isOpen, onClose, onTeachersUploaded }: BulkUploadModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [parsedTeachers, setParsedTeachers] = useState<ParsedTeacher[]>([])
  const [validTeachers, setValidTeachers] = useState<ParsedTeacher[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const resetModal = () => {
    setCurrentStep(1)
    setUploadedFile(null)
    setCsvData([])
    setHeaders([])
    setColumnMapping({})
    setParsedTeachers([])
    setValidTeachers([])
    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const downloadTemplate = () => {
    const templateHeaders = [
      'Name*',
      'Email*',
      'Employee ID*',
      'Phone',
      'Qualification',
      'Specialization',
      'Experience (Years)',
      'Address',
      'Hire Date (YYYY-MM-DD)'
    ]
    
    const sampleData = [
      [
        'John Doe',
        'john.doe@school.com',
        'TCH001',
        '+234 123 456 7890',
        'B.Ed (Bachelor of Education)',
        'Mathematics',
        '5',
        '123 School Street, Lagos',
        '2024-01-15'
      ],
      [
        'Jane Smith',
        'jane.smith@school.com',
        'TCH002',
        '+234 098 765 4321',
        'M.Sc (Master of Science)',
        'Physics',
        '8',
        '456 Teacher Avenue, Abuja',
        '2023-09-01'
      ]
    ]

    const csvContent = [templateHeaders, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teachers_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded successfully',
    })
  }

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map(line => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"' && (i === 0 || line[i - 1] === ',')) {
          inQuotes = true
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
          inQuotes = false
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else if (char !== '"' || inQuotes) {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    })
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV or Excel file',
        variant: 'destructive',
      })
      return
    }

    setUploadedFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const data = parseCSV(text)
      
      if (data.length < 2) {
        toast({
          title: 'Invalid File',
          description: 'File must contain at least a header row and one data row',
          variant: 'destructive',
        })
        return
      }

      setHeaders(data[0])
      setCsvData(data.slice(1))
      setCurrentStep(2)
      
      toast({
        title: 'File Uploaded',
        description: `Successfully parsed ${data.length - 1} rows`,
      })
    }
    
    reader.readAsText(file)
  }, [toast])

  const handleColumnMapping = (field: string, column: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: column }))
  }

  const validateAndParseTeachers = () => {
    const teachers: ParsedTeacher[] = csvData.map((row, index) => {
      const teacher: ParsedTeacher = {
        row: index + 2, // +2 because we start from row 2 (after header)
        errors: [],
        status: 'valid'
      }

      // Map columns to fields
      Object.entries(columnMapping).forEach(([field, column]) => {
        const columnIndex = headers.indexOf(column)
        if (columnIndex >= 0 && row[columnIndex]) {
          const value = row[columnIndex].trim()
          
          switch (field) {
            case 'name':
            case 'email':
            case 'employeeId':
            case 'phone':
            case 'qualification':
            case 'specialization':
            case 'address':
            case 'hireDate':
              teacher[field] = value
              break
            case 'experience':
              const exp = parseInt(value)
              if (!isNaN(exp) && exp >= 0) {
                teacher.experience = exp
              } else if (value) {
                teacher.errors.push(`Invalid experience value: ${value}`)
              }
              break
          }
        }
      })

      // Validate required fields
      requiredFields.forEach(field => {
        if (!teacher[field as keyof ParsedTeacher]) {
          teacher.errors.push(`${field} is required`)
        }
      })

      // Validate email format
      if (teacher.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacher.email)) {
        teacher.errors.push('Invalid email format')
      }

      // Validate hire date format
      if (teacher.hireDate && !/^\d{4}-\d{2}-\d{2}$/.test(teacher.hireDate)) {
        teacher.errors.push('Invalid hire date format (use YYYY-MM-DD)')
      }

      teacher.status = teacher.errors.length > 0 ? 'invalid' : 'valid'
      return teacher
    })

    // Check for duplicates within the file
    const emailMap = new Map<string, number[]>()
    const employeeIdMap = new Map<string, number[]>()

    teachers.forEach((teacher, index) => {
      if (teacher.email) {
        if (!emailMap.has(teacher.email)) {
          emailMap.set(teacher.email, [])
        }
        emailMap.get(teacher.email)!.push(index)
      }

      if (teacher.employeeId) {
        if (!employeeIdMap.has(teacher.employeeId)) {
          employeeIdMap.set(teacher.employeeId, [])
        }
        employeeIdMap.get(teacher.employeeId)!.push(index)
      }
    })

    // Mark duplicates
    emailMap.forEach((indices, email) => {
      if (indices.length > 1) {
        indices.forEach(index => {
          teachers[index].errors.push(`Duplicate email: ${email}`)
          teachers[index].status = 'duplicate'
        })
      }
    })

    employeeIdMap.forEach((indices, employeeId) => {
      if (indices.length > 1) {
        indices.forEach(index => {
          teachers[index].errors.push(`Duplicate employee ID: ${employeeId}`)
          teachers[index].status = 'duplicate'
        })
      }
    })

    setParsedTeachers(teachers)
    setValidTeachers(teachers.filter(t => t.status === 'valid'))
    setCurrentStep(3)
  }

  const handleImport = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const teachersToImport = validTeachers.map(teacher => ({
        name: teacher.name!,
        email: teacher.email!,
        employeeId: teacher.employeeId!,
        phone: teacher.phone,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        experience: teacher.experience || 0,
        address: teacher.address,
        hireDate: teacher.hireDate || new Date().toISOString().split('T')[0],
      }))

      const batchSize = 10
      const batches = []
      for (let i = 0; i < teachersToImport.length; i += batchSize) {
        batches.push(teachersToImport.slice(i, i + batchSize))
      }

      const importedTeachers: Teacher[] = []
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        
        const response = await fetch('/api/school/teachers/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teachers: batch }),
        })

        if (!response.ok) {
          throw new Error(`Failed to import batch ${i + 1}`)
        }

        const result = await response.json()
        importedTeachers.push(...result.teachers)
        
        setUploadProgress(((i + 1) / batches.length) * 100)
      }

      onTeachersUploaded(importedTeachers)
      setCurrentStep(4)
      
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${importedTeachers.length} teachers`,
      })
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import teachers',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <Upload className="h-6 w-6 text-blue-600" />
            <span>Bulk Upload Teachers</span>
          </DialogTitle>
          <DialogDescription>
            Upload multiple teachers at once using CSV or Excel files
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {uploadSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                getStepStatus(step.id) === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : getStepStatus(step.id) === 'current'
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {getStepStatus(step.id) === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < uploadSteps.length - 1 && (
                <div className="w-16 h-0.5 bg-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>

        <Tabs value={currentStep.toString()} className="space-y-6">
          {/* Step 1: Upload File */}
          <TabsContent value="1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>Upload File</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop your file here or click to browse</p>
                    <p className="text-gray-500">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button className="mt-4" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  
                  {uploadedFile && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">{uploadedFile.name}</span>
                      <Badge variant="secondary">{csvData.length} rows</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Map Columns */}
          <TabsContent value="2" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Map Columns</CardTitle>
                <p className="text-sm text-gray-600">
                  Map the columns from your file to the teacher fields
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...requiredFields, ...optionalFields].map((field) => (
                    <div key={field} className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                        {requiredFields.includes(field) && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </Label>
                      <Select
                        value={columnMapping[field] || ''}
                        onValueChange={(value) => handleColumnMapping(field, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Select Column --</SelectItem>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={validateAndParseTeachers}
                    disabled={!requiredFields.every(field => columnMapping[field])}
                  >
                    Next: Validate Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Validate Data */}
          <TabsContent value="3" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{validTeachers.length}</p>
                      <p className="text-sm text-gray-500">Valid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {parsedTeachers.filter(t => t.status === 'invalid').length}
                      </p>
                      <p className="text-sm text-gray-500">Invalid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {parsedTeachers.filter(t => t.status === 'duplicate').length}
                      </p>
                      <p className="text-sm text-gray-500">Duplicates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedTeachers.map((teacher, index) => (
                        <TableRow key={index}>
                          <TableCell>{teacher.row}</TableCell>
                          <TableCell>{teacher.name || '-'}</TableCell>
                          <TableCell>{teacher.email || '-'}</TableCell>
                          <TableCell>{teacher.employeeId || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                teacher.status === 'valid' ? 'default' :
                                teacher.status === 'duplicate' ? 'secondary' : 'destructive'
                              }
                            >
                              {teacher.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {teacher.errors.length > 0 && (
                              <div className="space-y-1">
                                {teacher.errors.map((error, i) => (
                                  <p key={i} className="text-xs text-red-600">{error}</p>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleImport}
                    disabled={validTeachers.length === 0}
                  >
                    Import {validTeachers.length} Teachers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: Import Complete */}
          <TabsContent value="4" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Import Successful!</h3>
                <p className="text-gray-600 mb-6">
                  Successfully imported {validTeachers.length} teachers
                </p>
                
                {isUploading && (
                  <div className="space-y-2 mb-6">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-500">Importing teachers... {uploadProgress.toFixed(0)}%</p>
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={resetModal}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Import More
                  </Button>
                  <Button onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
