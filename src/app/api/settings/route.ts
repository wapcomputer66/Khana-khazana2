import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET settings for the logged-in user's restaurant
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let settings = await db.settings.findUnique({
      where: { restaurantId: session.user.restaurantId }
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await db.settings.create({
        data: {
          restaurantName: session.user.restaurantName || 'My Restaurant',
          restaurantId: session.user.restaurantId
        }
      })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT update settings for the restaurant
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Get existing settings
    let settings = await db.settings.findUnique({
      where: { restaurantId: session.user.restaurantId }
    })

    if (settings) {
      // Update existing
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          restaurantName: body.restaurantName || settings.restaurantName,
          address: body.address || null,
          phone: body.phone || null,
          gstNumber: body.gstNumber || null,
          taxRate: parseFloat(body.taxRate) || 0,
          currency: body.currency || '₹',
          printerType: body.printerType || 'thermal',
          printerName: body.printerName || null,
          paperWidth: parseInt(body.paperWidth) || 80,
          kotCopies: parseInt(body.kotCopies) || 1,
          billCopies: parseInt(body.billCopies) || 1,
          showLogo: body.showLogo !== undefined ? body.showLogo : true
        }
      })
    } else {
      // Create new
      settings = await db.settings.create({
        data: {
          restaurantName: body.restaurantName || session.user.restaurantName || 'My Restaurant',
          address: body.address || null,
          phone: body.phone || null,
          gstNumber: body.gstNumber || null,
          taxRate: parseFloat(body.taxRate) || 0,
          currency: body.currency || '₹',
          printerType: body.printerType || 'thermal',
          printerName: body.printerName || null,
          paperWidth: parseInt(body.paperWidth) || 80,
          kotCopies: parseInt(body.kotCopies) || 1,
          billCopies: parseInt(body.billCopies) || 1,
          showLogo: body.showLogo !== undefined ? body.showLogo : true,
          restaurantId: session.user.restaurantId
        }
      })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
