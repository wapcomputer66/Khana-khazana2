import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// POST register new user with restaurant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, restaurantName, phone, address } = body

    // Validate input
    if (!name || !email || !password || !restaurantName) {
      return NextResponse.json(
        { success: false, error: 'सभी आवश्यक फ़ील्ड भरें (नाम, ईमेल, पासवर्ड, रेस्टोरेंट का नाम)' },
        { status: 400 }
      )
    }

    // Create restaurant
    const restaurant = await db.restaurant.create({
      data: {
        name: restaurantName,
        phone: phone || null,
        address: address || null,
        email: email || null
      }
    })

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin user linked to restaurant
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'admin',
        restaurantId: restaurant.id
      }
    })

    // Create default settings for the restaurant
    await db.settings.create({
      data: {
        restaurantName: restaurant.name,
        restaurantId: restaurant.id
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'यह ईमेल पहले से पंजीकृत है' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'रजिस्ट्रेशन में त्रुटि हुई' },
      { status: 500 }
    )
  }
}
