import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// POST detect menu items from image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const image = formData.get('image') as File
    const categoryId = formData.get('categoryId') as string | null

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image is required' },
        { status: 400 }
      )
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const imageDataUrl = `data:${image.type};base64,${base64}`

    // Get category for context
    let categoryContext = ''
    if (categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId }
      })
      if (category && category.restaurantId === session.user.restaurantId) {
        categoryContext = `The items should belong to "${category.name}" category.`
      }
    }

    // Use VLM to detect food items from image
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const prompt = `Analyze this food/restaurant menu image and identify all menu items visible.

${categoryContext}

Return ONLY a valid JSON array with this structure:
[
  {
    "name": "Item Name",
    "description": "Brief description of the item",
    "price": 0.00
  }
]

Rules:
- Identify all distinct food items/dishes visible
- Generate realistic prices in Indian Rupees (₹)
- Keep descriptions brief (1-2 sentences)
- Return ONLY JSON array, no other text
- Make sure JSON is valid and parseable
- If no food items are visible, return empty array []

Example:
Input: Image of restaurant menu
Output:
[
  {"name": "Butter Chicken", "description": "Tender chicken in rich tomato butter gravy", "price": 280},
  {"name": "Naan", "description": "Traditional Indian bread", "price": 30}
]`

    const completion = await zai.vlm.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: imageDataUrl
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ],
      temperature: 0.5
    })

    const aiResponse = completion.choices?.[0]?.message?.content || '[]'

    // Parse AI response
    let items
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse
      items = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse)
      return NextResponse.json(
        { success: false, error: 'Failed to detect menu items from image' },
        { status: 500 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No menu items detected in the image' },
        { status: 400 }
      )
    }

    // Get category ID if not provided
    let targetCategoryId = categoryId
    if (!targetCategoryId) {
      const categories = await db.category.findMany({
        where: { restaurantId: session.user.restaurantId },
        orderBy: { sortOrder: 'asc' }
      })
      targetCategoryId = categories.length > 0 ? categories[0].id : null
    }

    if (!targetCategoryId) {
      return NextResponse.json({
        success: true,
        items: items.map((item: any) => ({
          ...item,
          price: parseFloat(item.price) || 0,
          categoryId: null
        })),
        message: 'Please create a category first to save these items'
      })
    }

    // Add category ID to each item
    const itemsWithCategory = items.map((item: any) => ({
      ...item,
      categoryId: targetCategoryId,
      price: parseFloat(item.price) || 0
    }))

    return NextResponse.json({
      success: true,
      items: itemsWithCategory,
      detected: items.length
    })
  } catch (error) {
    console.error('Error detecting menu items from image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to detect menu items' },
      { status: 500 }
    )
  }
}
