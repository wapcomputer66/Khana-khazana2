'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Utensils,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">लोड हो रहा है...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'क्विक बिलिंग',
      description: 'नया बिल बनाएं',
      icon: ShoppingCart,
      href: '/billing',
      color: 'bg-orange-500'
    },
    {
      title: 'मेनू मैनेजमेंट',
      description: 'मेनू आइटम जोड़ें',
      icon: Package,
      href: '/menu',
      color: 'bg-amber-500'
    },
    {
      title: 'रिपोर्ट्स देखें',
      description: 'सेल्स और डेटा देखें',
      icon: FileText,
      href: '/reports',
      color: 'bg-emerald-500'
    },
    {
      title: 'सेटिंग्स',
      description: 'प्रिंटर और कॉन्फिगरेशन',
      icon: Users,
      href: '/settings',
      color: 'bg-blue-500'
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                नमस्ते, {session?.user?.name}! 👋
              </h1>
              <p className="text-orange-100 text-lg">
                आज के लिए क्या करना है?
              </p>
            </div>
            <div className="hidden md:block">
              <Utensils className="w-20 h-20 opacity-20" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                आज की बिक्री
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹0</div>
              <p className="text-xs text-gray-500 mt-1">अभी तक कोई ऑर्डर नहीं</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                कुल ऑर्डर
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">आज के कुल ऑर्डर</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                मेनू आइटम
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">कुल मेनू आइटम्स</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                कैटेगरीज़
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">कुल कैटेगरीज़</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            त्वरित कार्य
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Card
                key={action.href}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => router.push(action.href)}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <div className="mt-4 flex items-center text-orange-600 text-sm font-medium">
                    शुरू करें
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-xl">शुरू करने के लिए</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <p className="text-gray-700">
                सबसे पहले <strong className="text-orange-600">सेटिंग्स</strong> में जाकर अपने रेस्टोरेंट की जानकारी भरें
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <p className="text-gray-700">
                <strong className="text-orange-600">मेनू मैनेजमेंट</strong> में जाकर अपने मेनू आइटम्स जोड़ें (AI से bulk में भी जोड़ सकते हैं)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <p className="text-gray-700">
                अब <strong className="text-orange-600">क्विक बिलिंग</strong> से बिलिंग शुरू करें और प्रिंट करें
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
