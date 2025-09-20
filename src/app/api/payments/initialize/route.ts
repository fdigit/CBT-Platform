import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { initializePayment, generatePaymentReference } from '@/lib/paystack'
import { paymentSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 })
    }

    // Get school details
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { email: true, name: true }
    })

    if (!school) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 })
    }

    const reference = generatePaymentReference()

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        schoolId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: 'PENDING',
        reference,
      }
    })

    // Initialize Paystack payment
    const paymentData = {
      email: school.email,
      amount: validatedData.amount,
      currency: validatedData.currency,
      reference,
      metadata: {
        schoolId,
        schoolName: school.name,
        paymentId: payment.id,
      }
    }

    const paystackResponse = await initializePayment(paymentData)

    return NextResponse.json({
      paymentId: payment.id,
      reference: payment.reference,
      authorizationUrl: paystackResponse.data.authorization_url,
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { message: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
