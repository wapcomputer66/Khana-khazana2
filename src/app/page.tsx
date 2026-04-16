'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Utensils,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DashboardView } from '@/components/views/dashboard-view'
import { BillingView } from '@/components/views/billing-view'
import { MenuView } from '@/components/views/menu-view'
import { ReportsView } from '@/components/views/reports-view'
import { SettingsView } from '@/components/views/settings-view'
import { LoginView } from '@/components/views/login-view'

type ViewType = 'dashboard' | 'billing' | 'menu' | 'reports' | 'settings'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [currentView, setCurrentView] = React.useState<ViewType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    router.push(`/${view === 'dashboard' ? '' : view}`, { scroll: false })
  }

  if (status === 'unauthenticated') {
    return <LoginView />
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">लोड हो रहा है...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      currentView={currentView}
      onViewChange={handleViewChange}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
    >
      {currentView === 'dashboard' && <DashboardView onViewChange={handleViewChange} />}
      {currentView === 'billing' && <BillingView />}
      {currentView === 'menu' && <MenuView />}
      {currentView === 'reports' && <ReportsView />}
      {currentView === 'settings' && <SettingsView />}
    </DashboardLayout>
  )
}
