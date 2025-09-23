'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { schoolRegistrationSchema } from '../../lib/validations';
import { X } from 'lucide-react';

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolAdded: () => void;
}

export function AddSchoolModal({
  isOpen,
  onClose,
  onSchoolAdded,
}: AddSchoolModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = schoolRegistrationSchema.parse(formData);

      const response = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `School "${data.school.name}" created successfully!`,
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          adminName: '',
          adminEmail: '',
          adminPassword: '',
        });

        onSchoolAdded();
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to create school. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Please check your input and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Add New School</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Create a new school account on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter school name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">School Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter school email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">School Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter school phone (optional)"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Admin Account Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name *</Label>
                <Input
                  id="adminName"
                  name="adminName"
                  type="text"
                  placeholder="Enter admin full name"
                  value={formData.adminName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  placeholder="Enter admin email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  placeholder="Enter admin password (min 6 characters)"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Creating...' : 'Create School'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
