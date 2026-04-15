import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET all menu items for the restaurant
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const menuItems = await db.menuItem.findMany({
      where: { restaurantId: session.user.restaurantId },
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: menuItems })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

// POST create new menu item for the restaurant
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
    const { name, description, price, categoryId } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    // Verify category belongs to the same restaurant
    const category = await db.category.findUnique({
      where: { id: categoryId }
    })

    if (!category || category.restaurantId !== session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      )
    }

    const menuItem = await db.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        restaurantId: session.user.restaurantId
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ success: true, data: menuItem })
  } catch (error: any) {
    console.error('Error creating menu item:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'इस नाम का आइटम पहले से मौजूद है' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}
