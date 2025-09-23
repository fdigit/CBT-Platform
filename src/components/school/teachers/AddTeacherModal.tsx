'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Separator } from '../../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Key,
  Upload,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useToast } from '../../../hooks/use-toast'
import { Teacher } from '../../app/school/teachers/page'

const teacherSchema = z.object({
  // Personal Information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  
  // Professional Information
  employeeId: z.string().min(1, 'Employee ID is required'),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.coerce.number().int().min(0).max(50).optional(),
  hireDate: z.string().optional(),
  
  // Account Settings
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  generatePassword: z.boolean().default(true),
})

type TeacherFormData = z.infer<typeof teacherSchema>

interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onTeacherAdded: (teacher: Teacher) => void
}

export function AddTeacherModal({ isOpen, onClose, onTeacherAdded }: AddTeacherModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duplicateCheck, setDuplicateCheck] = useState<{
    email?: boolean
    employeeId?: boolean
  }>({})
  const { toast } = useToast()

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      employeeId: '',
      qualification: '',
      specialization: '',
      experience: undefined,
      hireDate: new Date().toISOString().split('T')[0],
      password: '',
      generatePassword: true,
    },
  })

  const watchedValues = form.watch()

  // Sample data (in real app, these would come from APIs)
  const qualifications = [
    'B.Ed (Bachelor of Education)',
    'M.Ed (Master of Education)',
    'B.Sc (Bachelor of Science)',
    'M.Sc (Master of Science)',
    'B.A (Bachelor of Arts)',
    'M.A (Master of Arts)',
    'PhD (Doctor of Philosophy)',
    'HND (Higher National Diploma)',
    'NCE (National Certificate in Education)',
    'Other'
  ]

  const specializations = [
    'Mathematics',
    'English Language',
    'Physics',
    'Chemistry',
    'Biology',
    'Government',
    'Economics',
    'Literature',
    'Geography',
    'History',
    'Computer Science',
    'Agricultural Science',
    'Technical Drawing',
    'Further Mathematics',
    'French',
    'Yoruba',
    'Igbo',
    'Hausa',
    'Other'
  ]

  const checkDuplicate = async (field: 'email' | 'employeeId', value: string) => {
    if (!value) return

    try {
      const response = await fetch(`/api/school/teachers/check-duplicate?${field}=${encodeURIComponent(value)}`)
      const data = await response.json()
      
      setDuplicateCheck(prev => ({
        ...prev,
        [field]: data.exists
      }))

      if (data.exists) {
        form.setError(field, {
          type: 'manual',
          message: `This ${field} is already in use`
        })
      } else {
        form.clearErrors(field)
      }
    } catch (error) {
      console.error(`Error checking ${field} duplicate:`, error)
    }
  }

  const generateEmployeeId = () => {
    const prefix = 'TCH'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    return `${prefix}${timestamp}${random}`
  }

  const onSubmit = async (data: TeacherFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/school/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          experience: data.experience || 0,
          hireDate: data.hireDate || new Date().toISOString(),
          password: data.generatePassword ? undefined : data.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create teacher')
      }

      const newTeacher = await response.json()
      
      onTeacherAdded(newTeacher)
      onClose()
      form.reset()
      
      toast({
        title: 'Success',
        description: `Teacher ${data.name} has been added successfully${newTeacher.tempPassword ? `. Temporary password: ${newTeacher.tempPassword}` : ''}`,
      })
    } catch (error) {
      console.error('Error creating teacher:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create teacher',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setDuplicateCheck({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <User className="h-6 w-6 text-blue-600" />
            <span>Add New Teacher</span>
          </DialogTitle>
          <DialogDescription>
            Fill in the teacher's information to create a new account. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="account">Account Settings</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>Full Name *</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter teacher's full name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>Email Address *</span>
                              {duplicateCheck.email === false && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {duplicateCheck.email === true && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="teacher@school.com" 
                                {...field}
                                onBlur={(e) => checkDuplicate('email', e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>Phone Number</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="tel"
                                placeholder="+234 xxx xxx xxxx" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hireDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Hire Date</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>Address</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter teacher's address"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information Tab */}
              <TabsContent value="professional" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Employee ID *</span>
                              {duplicateCheck.employeeId === false && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {duplicateCheck.employeeId === true && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input 
                                  placeholder="Enter employee ID" 
                                  {...field}
                                  onBlur={(e) => checkDuplicate('employeeId', e.target.value)}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const id = generateEmployeeId()
                                  field.onChange(id)
                                  checkDuplicate('employeeId', id)
                                }}
                              >
                                Generate
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                max="50"
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="qualification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Qualification</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select qualification" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {qualifications.map((qual) => (
                                  <SelectItem key={qual} value={qual}>
                                    {qual}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4" />
                              <span>Subject Specialization</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select specialization" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {specializations.map((spec) => (
                                  <SelectItem key={spec} value={spec}>
                                    {spec}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Settings Tab */}
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="generatePassword"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Generate Password</FormLabel>
                            <FormDescription>
                              Automatically generate a secure password for the teacher
                            </FormDescription>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {!watchedValues.generatePassword && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Key className="h-4 w-4" />
                              <span>Custom Password *</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Enter password (min. 6 characters)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 6 characters long
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Preview Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Teacher Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                          {watchedValues.name ? 
                            watchedValues.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 
                            'TC'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg">
                          {watchedValues.name || 'Teacher Name'}
                        </h3>
                        <p className="text-gray-600">
                          {watchedValues.employeeId || 'Employee ID'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {watchedValues.specialization && (
                            <Badge variant="secondary">{watchedValues.specialization}</Badge>
                          )}
                          {watchedValues.qualification && (
                            <Badge variant="outline">{watchedValues.qualification}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {watchedValues.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{watchedValues.email}</span>
                            </div>
                          )}
                          {watchedValues.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{watchedValues.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || duplicateCheck.email || duplicateCheck.employeeId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Creating Teacher...' : 'Create Teacher'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
