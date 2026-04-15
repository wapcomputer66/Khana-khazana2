import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    restaurantId: string
    restaurantName: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      restaurantId: string
      restaurantName: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
    restaurantId: string
    restaurantName: string
  }
}
