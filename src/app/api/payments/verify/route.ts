import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/paystack'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { message: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const paystackResponse = await verifyPayment(reference)

    if (!paystackResponse.status) {
      return NextResponse.json(
        { message: 'Payment verification failed' },
        { status: 400 }
      )
    }

    const { status: paymentStatus, amount, currency } = paystackResponse.data

    // Update payment record
    const payment = await prisma.payment.update({
      where: { reference },
      data: {
        status: paymentStatus === 'success' ? 'SUCCESS' : 'FAILED',
      },
      include: {
        school: true
      }
    })

    return NextResponse.json({
      success: paymentStatus === 'success',
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference: payment.reference,
      }
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { message: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
