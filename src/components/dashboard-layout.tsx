'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Utensils,
  ShoppingCart,
  LayoutDashboard,
  Menu as MenuIcon,
  FileText,
  Settings,
  LogOut,
  User,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentView?: string
  onViewChange?: (view: 'dashboard' | 'billing' | 'menu' | 'reports' | 'settings') => void
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
}

const navigation = [
  { name: 'डैशबोर्ड', href: 'dashboard', icon: LayoutDashboard },
  { name: 'क्विक बिलिंग', href: 'billing', icon: ShoppingCart },
  { name: 'मेनू मैनेजमेंट', href: 'menu', icon: MenuIcon },
  { name: 'रिपोर्ट्स', href: 'reports', icon: FileText },
  { name: 'सेटिंग्स', href: 'settings', icon: Settings },
]

export function DashboardLayout({ children, currentView, onViewChange, sidebarOpen = true, onSidebarToggle }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const handleNavigation = (view: string) => {
    if (onViewChange) {
      onViewChange(view as any)
    } else {
      router.push(`/${view === 'dashboard' ? '' : view}`)
    }
  }

  // Don't show layout on login page
  if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile Floating Menu Button */}
      <button
        onClick={onSidebarToggle}
        className="fixed top-3 left-3 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <MenuIcon className="h-5 w-5 text-gray-700" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-gradient-to-b from-orange-600 to-amber-600 text-white flex flex-col transition-all duration-300 z-40",
          sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-64"
        )}
      >
        {/* Logo & Close Button */}
        <div className="p-6 border-b border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <Utensils className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Restaurant POS</h1>
                <p className="text-xs text-orange-100">Billing System</p>
              </div>
            </div>
            <button
              onClick={onSidebarToggle}
              className="lg:hidden text-white hover:text-orange-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = currentView === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white text-orange-600 shadow-lg"
                      : "text-orange-50 hover:bg-orange-500 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-orange-500">
          <div className="bg-orange-700/50 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-orange-200 capitalize">
                  {session?.user?.role || 'Staff'}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-0"
          >
            <LogOut className="w-4 h-4 mr-2" />
            लॉगआउट
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 bg-gray-50 transition-all duration-300",
          sidebarOpen ? "lg:ml-64 ml-0" : "lg:ml-64"
        )}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
