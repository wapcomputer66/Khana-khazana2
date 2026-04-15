import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// POST create new order for the restaurant
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      orderNumber,
      customerName,
      customerPhone,
      tableNumber,
      subtotal,
      tax,
      totalAmount,
      items
    } = body

    if (!orderNumber || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify all menu items belong to the restaurant
    const menuItemIds = items.map((item: any) => item.menuItemId)
    const menuItems = await db.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: session.user.restaurantId
      }
    })

    if (menuItems.length !== items.length) {
      return NextResponse.json(
        { success: false, error: 'Some menu items are invalid' },
        { status: 400 }
      )
    }

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        tableNumber,
        subtotal: parseFloat(subtotal),
        tax: parseFloat(tax),
        totalAmount: parseFloat(totalAmount),
        paymentStatus: 'paid',
        orderStatus: 'completed',
        createdById: session.user.id,
        restaurantId: session.user.restaurantId,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          }))
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET all orders for the restaurant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      restaurantId: session.user.restaurantId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
