import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// POST generate menu items with AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get default or first category
    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    const defaultCategoryId = categories.length > 0 ? categories[0].id : null

    if (!defaultCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Please create a category first' },
        { status: 400 }
      )
    }

    // Use AI to generate menu items
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const aiPrompt = `You are a restaurant menu expert. Based on the user's request: "${prompt}", generate a list of menu items.

Return ONLY a valid JSON array with this structure:
[
  {
    "name": "Dish Name",
    "description": "Brief description",
    "price": 0.00
  }
]

Rules:
- Generate realistic prices in Indian Rupees (₹)
- Keep descriptions brief (1-2 sentences)
- Generate 3-8 items based on the input
- Return ONLY the JSON array, no other text
- Make sure the JSON is valid and parseable

Example:
Input: "Indian dishes: dal makhani, paneer tikka"
Output:
[
  {"name": "Dal Makhani", "description": "Creamy black lentils slow-cooked with butter and cream", "price": 180},
  {"name": "Paneer Tikka", "description": "Grilled cottage cheese cubes marinated in spices", "price": 220}
]`

    const completion = await zai.llm.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates restaurant menu items in JSON format.'
        },
        {
          role: 'user',
          content: aiPrompt
        }
      ],
      temperature: 0.7
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
        { success: false, error: 'Failed to generate valid menu items' },
        { status: 500 }
      )
    }

    // Add category ID to each item
    const itemsWithCategory = items.map((item: any) => ({
      ...item,
      categoryId: defaultCategoryId,
      price: parseFloat(item.price) || 0
    }))

    return NextResponse.json({
      success: true,
      items: itemsWithCategory
    })
  } catch (error) {
    console.error('Error generating menu items with AI:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate menu items' },
      { status: 500 }
    )
  }
}
