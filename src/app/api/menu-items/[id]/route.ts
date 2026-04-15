import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// PUT update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, price, categoryId, isActive, stock, unit } = body

    // Find menu item and verify it belongs to restaurant
    const menuItem = await db.menuItem.findUnique({
      where: { id: params.id }
    })

    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      )
    }

    if (menuItem.restaurantId !== session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this item' },
        { status: 403 }
      )
    }

    // If changing category, verify it belongs to same restaurant
    if (categoryId && categoryId !== menuItem.categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId }
      })

      if (!category || category.restaurantId !== session.user.restaurantId) {
        return NextResponse.json(
          { success: false, error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    const updatedItem = await db.menuItem.update({
      where: { id: params.id },
      data: {
        name: name || menuItem.name,
        description: description !== undefined ? description : menuItem.description,
        price: price !== undefined ? parseFloat(price) : menuItem.price,
        categoryId: categoryId || menuItem.categoryId,
        isActive: isActive !== undefined ? isActive : menuItem.isActive,
        stock: stock !== undefined ? stock : menuItem.stock,
        unit: unit !== undefined ? unit : menuItem.unit
      },
      include: {
        category: true,
        variations: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedItem })
  } catch (error: any) {
    console.error('Error updating menu item:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'इस नाम का आइटम पहले से मौजूद है' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

// DELETE menu item (only from the user's restaurant)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find the menu item and verify it belongs to the restaurant
    const menuItem = await db.menuItem.findUnique({
      where: { id: params.id }
    })

    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      )
    }

    if (menuItem.restaurantId !== session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this item' },
        { status: 403 }
      )
    }

    await db.menuItem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
