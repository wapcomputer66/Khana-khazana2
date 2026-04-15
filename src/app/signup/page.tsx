'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Utensils, Loader2, ArrowRight, LogIn, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!name.trim()) {
      setError('नाम आवश्यक है')
      setLoading(false)
      return
    }

    if (!email.trim()) {
      setError('ईमेल आवश्यक है')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('पासवर्ड कम से कम 6 अक्षर होना चाहिए')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('पासवर्ड मेल नहीं खाते')
      setLoading(false)
      return
    }

    if (!restaurantName.trim()) {
      setError('रेस्टोरेंट का नाम आवश्यक है')
      setLoading(false)
      return
    }

    try {
      // Register user with restaurant
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          restaurantName: restaurantName.trim(),
          phone: phone.trim(),
          address: address.trim()
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'रजिस्ट्रेशन में त्रुटि हुई')
        setLoading(false)
        return
      }

      toast({
        title: 'सफल',
        description: 'खाता और रेस्टोरेंट बनाया गया! अब लॉगिन करें।',
      })

      // Redirect to login page
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      setError('रजिस्ट्रेशन में त्रुटि हुई')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant POS</h1>
          <p className="text-gray-600 mt-2">नया खाता और रेस्टोरेंट बनाएं</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">साइन अप करें</CardTitle>
            <CardDescription className="text-base">
              अपनी जानकारी और रेस्टोरेंट का विवरण भरें
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Restaurant Section */}
              <div className="space-y-3 pb-4 border-b">
                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                  <Building2 className="w-4 h-4" />
                  <Label>रेस्टोरेंट जानकारी</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">रेस्टोरेंट का नाम *</Label>
                  <Input
                    id="restaurantName"
                    type="text"
                    placeholder="जैसे: Rahul's Restaurant"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">फोन नंबर</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="जैसे: +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">पता</Label>
                  <Textarea
                    id="address"
                    placeholder="रेस्टोरेंट का पता..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                    rows={2}
                  />
                </div>
              </div>

              {/* User Section */}
              <div className="space-y-3 pt-4">
                <div className="text-orange-600 font-semibold">
                  <Label>व्यक्तिगत जानकारी</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">पूरा नाम *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="जैसे: Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">ईमेल *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="जैसे: rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">पासवर्ड *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="कम से कम 6 अक्षर"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">पासवर्ड पुष्टि करें *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="पासवर्ड फिर से लिखें"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
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
                    रजिस्ट्रेशन हो रहा है...
                  </>
                ) : (
                  <>
                    साइन अप करें
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600 mb-3">पहले से खाता है?</p>
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="w-full"
          >
            <LogIn className="mr-2 h-4 w-4" />
            यहाँ लॉगिन करें
          </Button>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg p-4 shadow border border-orange-200">
          <h3 className="font-semibold text-gray-900 mb-2">मल्टी-रेस्टोरेंट सिस्टम:</h3>
          <p className="text-sm text-gray-600 mb-2">
            हर रेस्टोरेंट ओनर का अपना अलग डेटा और सेटिंग्स होगी। आप अपने रेस्टोरेंट का डेटा दूसरों से सुरक्षित रख सकते हैं।
          </p>
        </div>
      </div>
    </div>
  )
}
