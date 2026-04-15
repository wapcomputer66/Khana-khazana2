import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// PUT update category
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
    const { name, description, isActive, sortOrder } = body

    // Verify category belongs to restaurant
    const category = await db.category.findUnique({
      where: { id: params.id }
    })

    if (!category || category.restaurantId !== session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Category not found or unauthorized' },
        { status: 404 }
      )
    }

    const updatedCategory = await db.category.update({
      where: { id: params.id },
      data: {
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        isActive: isActive !== undefined ? isActive : category.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder
      }
    })

    return NextResponse.json({ success: true, data: updatedCategory })
  } catch (error: any) {
    console.error('Error updating category:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'इस नाम की कैटेगरी पहले से मौजूद है' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE category
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

    // Verify category belongs to restaurant
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    })

    if (!category || category.restaurantId !== session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has menu items
    if (category._count.menuItems > 0) {
      return NextResponse.json(
        { success: false, error: 'इस कैटेगरी में मेनू आइटम्स हैं, पहले उन्हें हटाएं या दूसरी कैटेगरी में ले जाएं' },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
