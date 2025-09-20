'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Key,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { Student } from '@/app/school/students/page'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onStudentAdded: (student: Student) => void
}

const studentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  regNumber: z.string().min(1, 'Registration number is required'),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  class: z.string().optional(),
  section: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Valid parent email required').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional()
})

interface ClassOption {
  id: string
  name: string
  section?: string
  displayName: string
}

export function AddStudentModal({ isOpen, onClose, onStudentAdded }: AddStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    regNumber: '',
    gender: '',
    classId: '',
    parentPhone: '',
    parentEmail: '',
    dateOfBirth: '',
    address: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Fetch classes when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchClasses()
    }
  }, [isOpen])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/school/classes?limit=100&status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        const classOptions = data.classes.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          section: cls.section,
          displayName: `${cls.name}${cls.section ? ` - ${cls.section}` : ''} (${cls.academicYear})`
        }))
        setClasses(classOptions)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      regNumber: '',
      gender: '',
      classId: '',
      parentPhone: '',
      parentEmail: '',
      dateOfBirth: '',
      address: '',
      password: ''
    })
    setErrors({})
    setStep('form')
    setGeneratedPassword('')
    setCreatedStudent(null)
    setShowPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const generateRegNumber = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `STU${year}${random}`
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const validateForm = () => {
    try {
      studentSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Generate reg number if not provided
      const regNumber = formData.regNumber || generateRegNumber()
      
      // Generate password if not provided
      const password = formData.password || generatePassword()
      
      const response = await fetch('/api/school/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          regNumber,
          password,
          classId: formData.classId === 'unassigned' ? undefined : formData.classId
        })
      })

      if (response.ok) {
        const newStudent = await response.json()
        setCreatedStudent(newStudent)
        
        // If password was auto-generated, show it to user
        if (newStudent.tempPassword) {
          setGeneratedPassword(newStudent.tempPassword)
        }
        
        setStep('success')
        onStudentAdded(newStudent)
        
        toast({
          title: 'Success',
          description: 'Student added successfully',
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to add student',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Create a new student account with their personal and academic information.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Registration Number</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="regNumber"
                        value={formData.regNumber}
                        onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                        placeholder="Leave empty to auto-generate"
                        className={errors.regNumber ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData({ ...formData, regNumber: generateRegNumber() })}
                      >
                        Generate
                      </Button>
                    </div>
                    {errors.regNumber && <p className="text-sm text-red-500">{errors.regNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Leave empty to auto-generate"
                          className={errors.password ? 'border-red-500' : ''}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData({ ...formData, password: generatePassword() })}
                      >
                        Generate
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <Select 
                    value={formData.classId} 
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No Class Assigned</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classes.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No active classes available. Create classes first to assign students.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      className={errors.parentEmail ? 'border-red-500' : ''}
                    />
                    {errors.parentEmail && <p className="text-sm text-red-500">{errors.parentEmail}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Adding Student...' : 'Add Student'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Student Added Successfully!</span>
              </DialogTitle>
              <DialogDescription>
                The student account has been created. Here are the login credentials:
              </DialogDescription>
            </DialogHeader>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Student Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="font-medium">{createdStudent?.name}</p>
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {createdStudent?.regNumber}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(createdStudent?.regNumber || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {createdStudent?.email}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(createdStudent?.email || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {generatedPassword && (
                    <div>
                      <Label>Generated Password</Label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-yellow-100 px-2 py-1 rounded text-sm font-mono">
                          {generatedPassword}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(generatedPassword)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {generatedPassword && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Please share these credentials securely with the student. 
                      The password will not be shown again, so make sure to copy it now.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}