import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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
