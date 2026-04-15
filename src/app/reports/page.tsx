'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  ShoppingCart,
  Calendar,
  FileText,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Order {
  id: string
  orderNumber: string
  customerName?: string
  customerPhone?: string
  tableNumber?: string
  subtotal: number
  tax: number
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  createdAt: string
  items: any[]
}

interface ReportStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalItems: number
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<ReportStats | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<ReportStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<ReportStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)

      // Get today's date ranges
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      // Get weekly range (last 7 days)
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 7)

      // Get monthly range (this month)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      // Fetch daily, weekly, and monthly orders
      const [dailyRes, weeklyRes, monthlyRes, recentRes] = await Promise.all([
        fetch(`/api/orders?startDate=${todayStart.toISOString()}&endDate=${todayEnd.toISOString()}`),
        fetch(`/api/orders?startDate=${weekStart.toISOString()}&endDate=${todayEnd.toISOString()}`),
        fetch(`/api/orders?startDate=${monthStart.toISOString()}&endDate=${todayEnd.toISOString()}`),
        fetch('/api/orders?limit=20')
      ])

      const dailyData = await dailyRes.json()
      const weeklyData = await weeklyRes.json()
      const monthlyData = await monthlyRes.json()
      const recentData = await recentRes.json()

      setDailyStats(calculateStats(dailyData.data || []))
      setWeeklyStats(calculateStats(weeklyData.data || []))
      setMonthlyStats(calculateStats(monthlyData.data || []))
      setRecentOrders(recentData.data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: 'त्रुटि',
        description: 'रिपोर्ट्स लोड करने में विफल',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (orders: Order[]): ReportStats => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const totalItems = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0)
    }, 0)

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalItems
    }
  }

  const StatCard = ({ stats, title, icon: Icon, color }: { stats: ReportStats | null, title: string, icon: any, color: string }) => {
    if (!stats) return null

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Icon className={`w-4 h-4 ${color}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500">कुल बिक्री</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500">ऑर्डर्स</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold">{stats.totalItems}</p>
              <p className="text-xs text-gray-500">आइटम्स</p>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-gray-600">औसत ऑर्डर:</p>
            <p className="font-semibold">₹{stats.averageOrderValue.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">रिपोर्ट्स</h1>
            <p className="text-gray-600 mt-1">सेल्स और बिज़नेस विश्लेषण</p>
          </div>
          <Button
            onClick={fetchReports}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            रिफ्रेश करें
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">ओवरव्यू</TabsTrigger>
            <TabsTrigger value="orders">ऑर्डर्स</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                stats={dailyStats}
                title="आज की बिक्री"
                icon={Calendar}
                color="text-orange-500"
              />
              <StatCard
                stats={weeklyStats}
                title="पिछले 7 दिन"
                icon={TrendingUp}
                color="text-emerald-500"
              />
              <StatCard
                stats={monthlyStats}
                title="इस महीने"
                icon={ShoppingCart}
                color="text-blue-500"
              />
            </div>

            {/* Revenue Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>बिक्री की तुलना</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">आज के मुकाबले पिछले 7 दिन</p>
                      <p className="text-xs text-gray-500">
                        {dailyStats && weeklyStats && (
                          <>
                            {weeklyStats.totalOrders > 0
                              ? `₹${(weeklyStats.totalRevenue / 7).toFixed(0)} avg/day`
                              : 'No data'
                            }
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {dailyStats && weeklyStats && (
                        <>
                          {dailyStats.totalRevenue >= (weeklyStats.totalRevenue / 7) ? (
                            <div className="flex items-center text-emerald-600">
                              <ArrowUp className="w-4 h-4" />
                              <span className="font-semibold">
                                {weeklyStats.totalRevenue > 0
                                  ? `${(((dailyStats.totalRevenue - (weeklyStats.totalRevenue / 7)) / (weeklyStats.totalRevenue / 7)) * 100).toFixed(0)}%`
                                  : '0%'
                                }
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <ArrowDown className="w-4 h-4" />
                              <span className="font-semibold">
                                {weeklyStats.totalRevenue > 0
                                  ? `${(((weeklyStats.totalRevenue / 7 - dailyStats.totalRevenue) / (weeklyStats.totalRevenue / 7)) * 100).toFixed(0)}%`
                                  : '0%'
                                }
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">आज के मुकाबले इस महीने</p>
                      <p className="text-xs text-gray-500">
                        {dailyStats && monthlyStats && (
                          <>
                            {monthlyStats.totalOrders > 0
                              ? `₹${(monthlyStats.totalRevenue / new Date().getDate()).toFixed(0)} avg/day`
                              : 'No data'
                            }
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {dailyStats && monthlyStats && (
                        <>
                          {dailyStats.totalRevenue >= (monthlyStats.totalRevenue / new Date().getDate()) ? (
                            <div className="flex items-center text-emerald-600">
                              <ArrowUp className="w-4 h-4" />
                              <span className="font-semibold">
                                {monthlyStats.totalRevenue > 0
                                  ? `${(((dailyStats.totalRevenue - (monthlyStats.totalRevenue / new Date().getDate())) / (monthlyStats.totalRevenue / new Date().getDate())) * 100).toFixed(0)}%`
                                  : '0%'
                                }
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <ArrowDown className="w-4 h-4" />
                              <span className="font-semibold">
                                {monthlyStats.totalRevenue > 0
                                  ? `${(((monthlyStats.totalRevenue / new Date().getDate() - dailyStats.totalRevenue) / (monthlyStats.totalRevenue / new Date().getDate())) * 100).toFixed(0)}%`
                                  : '0%'
                                }
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>हाल के ऑर्डर्स</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">कोई ऑर्डर नहीं है</p>
                    <p className="text-sm">बिलिंग शुरू करें ऑर्डर्स देखने के लिए</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {recentOrders.map(order => (
                        <div
                          key={order.id}
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900">
                                  {order.orderNumber}
                                </span>
                                <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                                  {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                                {order.tableNumber && (
                                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                    Table {order.tableNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {order.customerName && `ग्राहक: ${order.customerName}`}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {formatDate(order.createdAt)}
                              </p>
                              <div className="text-sm">
                                <p className="text-gray-600">आइटम्स: {order.items.length}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-orange-600">
                                ₹{order.totalAmount.toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {order.items.reduce((sum, item) => sum + item.quantity, 0)} आइटम्स
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
