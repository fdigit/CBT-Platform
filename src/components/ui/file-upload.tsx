'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from './button'
import { Progress } from './progress'
import { cn } from '../../lib/utils'
import {
  Upload,
  X,
  FileText,
  Image,
  Video,
  Music,
  File,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

export interface UploadedFile {
  id?: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt?: string
}

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void
  onRemove?: (file: UploadedFile) => void
  uploadEndpoint: string
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  existingFiles?: UploadedFile[]
  disabled?: boolean
  className?: string
  multiple?: boolean
  label?: string
  description?: string
  additionalData?: Record<string, string>
}

export function FileUpload({
  onUpload,
  onRemove,
  uploadEndpoint,
  maxFiles = 5,
  maxSize = 25,
  acceptedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3'],
  existingFiles = [],
  disabled = false,
  className,
  multiple = true,
  label = 'Upload Files',
  description = 'Drag and drop files here or click to browse',
  additionalData = {},
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Video
    if (type.startsWith('audio/')) return Music
    if (type.includes('pdf')) return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `${file.name} exceeds the ${maxSize}MB limit`,
        variant: 'destructive',
      })
      return false
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (fileExtension && !acceptedTypes.includes(fileExtension)) {
      toast({
        title: 'File type not supported',
        description: `${file.name} has an unsupported file type`,
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    // Check total file count
    if (existingFiles.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    const uploadedFiles: UploadedFile[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (!validateFile(file)) continue

        const formData = new FormData()
        formData.append('file', file)
        
        // Add additional data
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value)
        })

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const result = await response.json()
        
        // Handle different response structures
        const uploadedFile: UploadedFile = {
          id: result.attachment?.id || result.resource?.id || result.file?.id || result.id,
          name: result.attachment?.originalName || result.resource?.originalName || result.file?.name || result.name || file.name,
          url: result.attachment?.url || result.resource?.url || result.file?.url || result.url,
          size: result.attachment?.size || result.resource?.size || result.file?.size || result.size || file.size,
          type: result.attachment?.mimeType || result.resource?.mimeType || result.file?.type || result.type || file.type,
          uploadedAt: result.attachment?.uploadedAt || result.resource?.uploadedAt || result.file?.uploadedAt || result.uploadedAt,
        }

        uploadedFiles.push(uploadedFile)
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      if (uploadedFiles.length > 0) {
        onUpload(uploadedFiles)
        toast({
          title: 'Upload successful',
          description: `${uploadedFiles.length} file(s) uploaded successfully`,
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [uploadEndpoint, additionalData, existingFiles.length, maxFiles, maxSize, acceptedTypes, onUpload, toast])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || uploading) return

    const files = Array.from(e.dataTransfer.files)
    uploadFiles(files)
  }, [disabled, uploading, uploadFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || uploading) return

    const files = Array.from(e.target.files || [])
    uploadFiles(files)
    
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [disabled, uploading, uploadFiles])

  const handleRemove = (file: UploadedFile) => {
    if (onRemove) {
      onRemove(file)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400',
          uploading && 'pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <p className="text-xs text-gray-400">
              Max {maxSize}MB per file • {acceptedTypes.join(', ').toUpperCase()}
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
          <div className="space-y-2">
            {existingFiles.map((file, index) => {
              const FileIcon = getFileIcon(file.type)
              return (
                <div
                  key={file.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                        {file.uploadedAt && (
                          <span> • {new Date(file.uploadedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {onRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(file)}
                        disabled={disabled}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* File Count Info */}
      {maxFiles > 1 && (
        <p className="text-xs text-gray-500">
          {existingFiles.length} of {maxFiles} files uploaded
        </p>
      )}
    </div>
  )
}
