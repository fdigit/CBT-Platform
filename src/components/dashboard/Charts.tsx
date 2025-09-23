'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartData {
  studentGrowthData: { month: string; students: number }[]
  examData: { month: string; exams: number }[]
  subscriptionData: { name: string; value: number; color: string }[]
}

// Default/fallback data
const defaultStudentGrowthData = [
  { month: 'Jan', students: 0 },
  { month: 'Feb', students: 0 },
  { month: 'Mar', students: 0 },
  { month: 'Apr', students: 0 },
  { month: 'May', students: 0 },
  { month: 'Jun', students: 0 },
]

const defaultExamData = [
  { month: 'Jan', exams: 0 },
  { month: 'Feb', exams: 0 },
  { month: 'Mar', exams: 0 },
  { month: 'Apr', exams: 0 },
  { month: 'May', exams: 0 },
  { month: 'Jun', exams: 0 },
]

const defaultSubscriptionData = [
  { name: 'Monthly', value: 0, color: '#2563eb' },
  { name: 'Yearly', value: 0, color: '#f97316' },
  { name: 'Pay-per-exam', value: 0, color: '#10b981' },
]

interface StudentGrowthChartProps {
  className?: string
}

export function StudentGrowthChart({ className }: StudentGrowthChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/admin/charts')
        if (response.ok) {
          const data = await response.json()
          setChartData(data)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  const data = chartData?.studentGrowthData || defaultStudentGrowthData

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Student Growth Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading chart data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#2563eb"
                strokeWidth={2}
                name="New Students"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

interface ExamChartProps {
  className?: string
}

export function ExamChart({ className }: ExamChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/admin/charts')
        if (response.ok) {
          const data = await response.json()
          setChartData(data)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  const data = chartData?.examData || defaultExamData

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Exams Created Per Month</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading chart data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="exams" fill="#f97316" name="Exams Created" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

interface SubscriptionChartProps {
  className?: string
}

export function SubscriptionChart({ className }: SubscriptionChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/admin/charts')
        if (response.ok) {
          const data = await response.json()
          setChartData(data)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  const data = chartData?.subscriptionData || defaultSubscriptionData

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading chart data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
