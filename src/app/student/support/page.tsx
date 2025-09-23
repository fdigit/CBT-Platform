'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Book,
  Monitor,
  Wifi,
  User,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { StudentDashboardLayout } from '../../../components/student';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

interface ContactForm {
  subject: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const FAQ_ITEMS = [
  {
    question: 'How do I start an exam?',
    answer:
      "Navigate to 'My Exams' and click 'Start Exam' on any active exam. Make sure you have a stable internet connection and your browser is up to date.",
    category: 'exams',
  },
  {
    question: 'What happens if I lose internet connection during an exam?',
    answer:
      'Your answers are automatically saved every 30 seconds. If you lose connection, reconnect and continue where you left off. Contact support if you need additional time.',
    category: 'technical',
  },
  {
    question: 'How can I view my exam results?',
    answer:
      "Go to the 'Results' section in your dashboard. You can view detailed scorecards, download PDF reports, and track your performance over time.",
    category: 'results',
  },
  {
    question: 'Can I change my profile information?',
    answer:
      "Yes, go to 'Profile' to update your personal information. Note that your email and student ID cannot be changed - contact support if needed.",
    category: 'account',
  },
  {
    question: 'What browsers are supported?',
    answer:
      'We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, ensure JavaScript is enabled and pop-ups are allowed.',
    category: 'technical',
  },
  {
    question: 'How do I reset my password?',
    answer:
      "Go to 'Profile' → 'Security Settings' to change your password. If you forgot your password, use the 'Forgot Password' link on the login page.",
    category: 'account',
  },
];

const SUPPORT_CATEGORIES = [
  { value: 'technical', label: 'Technical Issues', icon: Monitor },
  { value: 'exams', label: 'Exam Related', icon: Book },
  { value: 'account', label: 'Account & Profile', icon: User },
  { value: 'results', label: 'Results & Grades', icon: FileText },
  { value: 'other', label: 'Other', icon: HelpCircle },
];

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    subject: '',
    category: '',
    description: '',
    priority: 'medium',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin');
      return;
    }

    fetchTickets();
  }, [session, status, router]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/student/support/tickets');
      if (response.ok) {
        const ticketsData = await response.json();
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (
      !contactForm.subject ||
      !contactForm.category ||
      !contactForm.description
    ) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/student/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        const newTicket = await response.json();
        setTickets([newTicket, ...tickets]);
        setContactForm({
          subject: '',
          category: '',
          description: '',
          priority: 'medium',
        });
        toast({
          title: 'Success',
          description: 'Your support ticket has been submitted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit support ticket',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting your ticket',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            Open
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-50 text-yellow-700">In Progress</Badge>
        );
      case 'resolved':
        return <Badge className="bg-green-50 text-green-700">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-50 text-orange-700">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading support...</p>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">
            Get help with your account, exams, and technical issues
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Email Support</h3>
                  <p className="text-sm text-gray-600">support@cbt.edu</p>
                  <p className="text-xs text-gray-500">
                    Response within 24 hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Phone Support</h3>
                  <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-xs text-gray-500">Mon-Fri, 9AM-5PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Live Chat</h3>
                  <p className="text-sm text-gray-600">Available now</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Start Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Submit Ticket</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
                <CardDescription>
                  Find quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {FAQ_ITEMS.map((item, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-6 last:border-b-0"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {item.question}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.answer}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {item.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span>Submit a Support Ticket</span>
                </CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you as soon as
                  possible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={e =>
                        setContactForm({
                          ...contactForm,
                          subject: e.target.value,
                        })
                      }
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={contactForm.category}
                      onChange={e =>
                        setContactForm({
                          ...contactForm,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="">Select category</option>
                      {SUPPORT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={contactForm.priority}
                    onChange={e =>
                      setContactForm({
                        ...contactForm,
                        priority: e.target.value as any,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={contactForm.description}
                    onChange={e =>
                      setContactForm({
                        ...contactForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Please provide detailed information about your issue..."
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSubmitTicket}
                  disabled={submitting}
                  className="w-full flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Ticket'}</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>My Support Tickets</span>
                </CardTitle>
                <CardDescription>
                  Track the status of your submitted tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tickets yet
                    </h3>
                    <p className="text-gray-600">
                      Submit your first support ticket to get help
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map(ticket => (
                      <div
                        key={ticket.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {ticket.subject}
                              </h4>
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {ticket.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Created:{' '}
                                  {new Date(
                                    ticket.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>
                                  Updated:{' '}
                                  {new Date(
                                    ticket.updatedAt
                                  ).toLocaleDateString()}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Exam Platform</p>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">User Authentication</p>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Results System</p>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentDashboardLayout>
  );
}
