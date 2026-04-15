'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Utensils, Loader2, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('ईमेल या पासवर्ड गलत है')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setError('लॉगिन में त्रुटि हुई')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-full">
              <Utensils className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Restaurant POS</CardTitle>
          <CardDescription className="text-base">
            अपने अकाउंट में लॉगिन करें
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ईमेल</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">पासवर्ड</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  लॉगिन हो रहा है...
                </>
              ) : (
                'लॉगिन करें'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800 font-medium mb-2">
              डिफ़ॉल्ट लॉगिन विवरण:
            </p>
            <p className="text-sm text-orange-700">
              ईमेल: admin@restaurant.com
            </p>
            <p className="text-sm text-orange-700">
              पासवर्ड: admin123
            </p>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-gray-600 mb-3">नया खाता नहीं है?</p>
            <Button
              onClick={() => router.push('/signup')}
              variant="outline"
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              साइन अप करें
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
