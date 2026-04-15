import { db } from './db'
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createDefaultAdmin() {
  const existingAdmin = await db.user.findFirst({
    where: { email: 'admin@restaurant.com' }
  })

  if (!existingAdmin) {
    const hashedPassword = await hashPassword('admin123')
    await db.user.create({
      data: {
        email: 'admin@restaurant.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin'
      }
    })
    console.log('Default admin account created')
  }
}
