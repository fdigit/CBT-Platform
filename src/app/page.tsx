'use client';

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { DashboardRedirect } from '../components/DashboardRedirect';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  BookOpen,
  Users,
  Shield,
  CreditCard,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      school: 'Lagos State University',
      content:
        'This platform has revolutionized our examination process. The security features and ease of use are outstanding.',
      avatar: 'SJ',
      rating: 5,
    },
    {
      name: 'Prof. Michael Adebayo',
      school: 'University of Ibadan',
      content:
        'The auto-grading feature saves us hours of work. Students love the intuitive interface.',
      avatar: 'MA',
      rating: 5,
    },
    {
      name: 'Dr. Funmi Okafor',
      school: 'Federal University of Technology',
      content:
        'Excellent customer support and reliable platform. Highly recommended for educational institutions.',
      avatar: 'FO',
      rating: 5,
    },
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      prev => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <DashboardRedirect />
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-[#2563eb] mr-3" />
              <h1 className="text-2xl font-bold text-[#111827]">
                CBT Platform
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-[#111827] hover:text-[#2563eb] transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-[#111827] hover:text-[#2563eb] transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="#pricing"
                className="text-[#111827] hover:text-[#2563eb] transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#testimonials"
                className="text-[#111827] hover:text-[#2563eb] transition-colors"
              >
                Testimonials
              </Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  className="border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-all"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-[#2563eb] hover:bg-blue-700 text-white transition-all">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col space-y-4">
                <Link
                  href="#features"
                  className="text-[#111827] hover:text-[#2563eb] transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-[#111827] hover:text-[#2563eb] transition-colors"
                >
                  How it Works
                </Link>
                <Link
                  href="#pricing"
                  className="text-[#111827] hover:text-[#2563eb] transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="#testimonials"
                  className="text-[#111827] hover:text-[#2563eb] transition-colors"
                >
                  Testimonials
                </Link>
                <div className="flex flex-col space-y-2 pt-4">
                  <Link href="/auth/signin">
                    <Button
                      variant="outline"
                      className="w-full border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-[#111827] mb-6 leading-tight">
                Transform Your
                <span className="text-[#2563eb]"> Education</span>
                with Smart CBT
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The most comprehensive Computer-Based Testing platform for
                schools. Secure, scalable, and designed for modern education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-xl transition-all hover:shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#facc15] text-[#111827] hover:bg-[#facc15] px-8 py-4 text-lg rounded-xl transition-all"
                  >
                    Book a Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[#2563eb] to-blue-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <BookOpen className="h-6 w-6 text-[#2563eb]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Mathematics Exam
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm">Question 1 of 20</p>
                    </div>
                    <div className="bg-[#2563eb] text-white rounded-lg p-4">
                      <p className="text-sm">What is 15 + 27?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111827] mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to conduct secure, efficient, and
              comprehensive online examinations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="bg-[#2563eb] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-[#111827]">
                  School Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Easy onboarding process with admin approval workflow. Get
                  started in minutes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="bg-[#facc15] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-[#111827]">
                  Secure Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Advanced anti-cheating measures with fullscreen mode and
                  copy-paste protection.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="bg-green-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-[#111827]">
                  Auto Grading
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Instant grading for objective questions with detailed
                  performance analytics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="bg-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-[#111827]">
                  Flexible Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Multiple payment options with Paystack integration for
                  seamless transactions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f9fafb]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111827] mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with our platform in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="bg-[#2563eb] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-4">
                Register Your School
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Sign up with your school details and wait for approval from our
                super admin team.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-[#facc15] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-4">
                Manage Students
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Add students individually or bulk import via CSV. Each student
                gets unique login credentials.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-4">
                Conduct Exams
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Create exams with various question types, set time limits, and
                monitor student progress in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111827] mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your school&apos;s needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-[#111827]">
                  Starter
                </CardTitle>
                <div className="text-4xl font-bold text-[#111827] mt-4">
                  ₦10,000
                  <span className="text-lg text-gray-600 font-normal">
                    /month
                  </span>
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  Perfect for small schools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Up to 100 students</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">5 concurrent exams</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Basic analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Email support</span>
                  </div>
                </div>
                <Button className="w-full bg-gray-100 text-[#111827] hover:bg-gray-200 rounded-xl py-3 mt-6">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan - Highlighted */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-[#2563eb] rounded-2xl relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#facc15] text-[#111827] px-4 py-1 rounded-full">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-[#111827]">
                  Professional
                </CardTitle>
                <div className="text-4xl font-bold text-[#111827] mt-4">
                  ₦25,000
                  <span className="text-lg text-gray-600 font-normal">
                    /month
                  </span>
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  Best for growing schools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Up to 500 students</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Unlimited exams</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Custom branding</span>
                  </div>
                </div>
                <Button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl py-3 mt-6">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-[#111827]">
                  Enterprise
                </CardTitle>
                <div className="text-4xl font-bold text-[#111827] mt-4">
                  Custom
                  <span className="text-lg text-gray-600 font-normal">
                    /month
                  </span>
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  For large institutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Unlimited students</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Unlimited exams</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Custom analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">24/7 support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">API access</span>
                  </div>
                </div>
                <Button className="w-full bg-gray-100 text-[#111827] hover:bg-gray-200 rounded-xl py-3 mt-6">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f9fafb]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111827] mb-4">
              What Schools Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trusted by leading educational institutions across Nigeria
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-6 w-6 text-[#facc15] fill-current"
                    />
                  ))}
                </div>
                <blockquote className="text-2xl text-gray-700 mb-8 leading-relaxed">
                  &quot;{testimonials[currentTestimonial].content}&quot;
                </blockquote>
                <div className="flex items-center justify-center">
                  <div className="bg-[#2563eb] w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[#111827] text-lg">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-gray-600">
                      {testimonials[currentTestimonial].school}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all"
              >
                <ChevronLeft className="h-6 w-6 text-[#2563eb]" />
              </button>
              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all"
              >
                <ChevronRight className="h-6 w-6 text-[#2563eb]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2563eb] to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your School&apos;s Examination Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of schools already using our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-[#2563eb] hover:bg-gray-100 px-8 py-4 text-lg rounded-xl transition-all hover:shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#2563eb] px-8 py-4 text-lg rounded-xl transition-all"
              >
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo Column */}
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-[#2563eb] mr-3" />
                <h3 className="text-2xl font-bold">CBT Platform</h3>
              </div>
              <p className="text-gray-400 mb-4">
                The leading Computer-Based Testing platform for educational
                institutions.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#2563eb] transition-colors cursor-pointer">
                  <span className="text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#2563eb] transition-colors cursor-pointer">
                  <span className="text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#2563eb] transition-colors cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
              </div>
            </div>

            {/* Links Column */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#help"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#contact"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#docs"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#status"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    System Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#blog"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#careers"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2024 CBT Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
