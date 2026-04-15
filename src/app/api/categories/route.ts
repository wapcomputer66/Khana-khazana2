import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET all categories for the logged-in user's restaurant
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const categories = await db.category.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST create new category for the restaurant
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        name,
        description,
        restaurantId: session.user.restaurantId
      }
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error: any) {
    console.error('Error creating category:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'इस नाम की कैटेगरी पहले से मौजूद है' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
