import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET settings
export async function GET() {
  try {
    let settings = await db.settings.findFirst()

    // Create default settings if none exist
    if (!settings) {
      settings = await db.settings.create({
        data: {
          restaurantName: 'My Restaurant',
          address: '',
          phone: '',
          gstNumber: '',
          taxRate: 0,
          currency: '₹',
          printerType: 'thermal',
          paperWidth: 80,
          kotCopies: 1,
          billCopies: 1,
          showLogo: true
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

// PUT update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Get existing settings
    let settings = await db.settings.findFirst()

    if (settings) {
      // Update existing
      settings = await db.settings.update({
        where: { id: settings.id },
        data: body
      })
    } else {
      // Create new
      settings = await db.settings.create({
        data: {
          restaurantName: body.restaurantName || 'My Restaurant',
          address: body.address || '',
          phone: body.phone || '',
          gstNumber: body.gstNumber || '',
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
