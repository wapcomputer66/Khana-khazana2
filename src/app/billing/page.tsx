'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShoppingCart,
  Printer,
  Save,
  Trash2,
  Plus,
  Minus,
  Search,
  UtensilsCrossed,
  Check,
  Receipt
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  category?: Category
}

interface CartItem extends MenuItem {
  quantity: number
  notes?: string
}

export default function BillingPage() {
  const { toast } = useToast()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [taxRate, setTaxRate] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Recalculate tax whenever cart changes
    calculateTax()
  }, [cart])

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes, settingsRes] = await Promise.all([
        fetch('/api/menu-items'),
        fetch('/api/categories'),
        fetch('/api/settings')
      ])

      const itemsData = await itemsRes.json()
      const catsData = await catsRes.json()
      const settingsData = await settingsRes.json()

      setMenuItems(itemsData.data || [])
      setCategories(catsData.data || [])

      if (settingsData.data) {
        setTaxRate(settingsData.data.taxRate || 0)
      }
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'डेटा लोड करने में विफल',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTax = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    return subtotal * (taxRate / 100)
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = calculateTax()
  const total = subtotal + tax

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter(item => item.quantity > 0)
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    if (cart.length === 0) return
    if (confirm('क्या आप कार्ट खाली करना चाहते हैं?')) {
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setTableNumber('')
    }
  }

  const handleSaveAndPrint = async () => {
    if (cart.length === 0) {
      toast({
        title: 'त्रुटि',
        description: 'कार्ट खाली है',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          tableNumber: tableNumber || null,
          subtotal,
          tax,
          totalAmount: total,
          items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          }))
        })
      })

      if (!res.ok) throw new Error('Failed to create order')

      const data = await res.json()

      // Print the bill
      await printOrder(data.data)

      toast({
        title: 'सफल',
        description: `ऑर्डर ${orderNumber} सहेजा गया और प्रिंट हुआ`
      })

      // Clear cart
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setTableNumber('')
    } catch (error) {
      console.error('Error saving order:', error)
      toast({
        title: 'त्रुटि',
        description: 'ऑर्डर सहेजने में विफल',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePrintKOT = () => {
    if (cart.length === 0) {
      toast({
        title: 'त्रुटि',
        description: 'कार्ट खाली है',
        variant: 'destructive'
      })
      return
    }

    printKOT()
  }

  const printOrder = async (order: any) => {
    // Print functionality using browser print API
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'चेतावनी',
        description: 'पॉप-अप ब्लॉक है, प्रिंट नहीं हो सका',
        variant: 'destructive'
      })
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${order.orderNumber}</title>
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            max-width: 280px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
          }
          .info {
            margin-bottom: 10px;
          }
          .items-table {
            width: 100%;
            margin-bottom: 10px;
            border-collapse: collapse;
          }
          .items-table th,
          .items-table td {
            text-align: left;
            padding: 3px 0;
          }
          .items-table .price-col {
            text-align: right;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .total-section {
            margin-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .grand-total {
            font-weight: bold;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 1px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RESTAURANT BILL</h1>
          <p>Order #: ${order.orderNumber}</p>
          <p>${new Date().toLocaleString('en-IN')}</p>
        </div>

        ${customerName ? `<div class="info"><strong>Customer:</strong> ${customerName}</div>` : ''}
        ${tableNumber ? `<div class="info"><strong>Table:</strong> ${tableNumber}</div>` : ''}
        ${customerPhone ? `<div class="info"><strong>Phone:</strong> ${customerPhone}</div>` : ''}

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th class="price-col">Price</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td class="price-col">₹${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          ${tax > 0 ? `
            <div class="total-row">
              <span>Tax (${taxRate}%):</span>
              <span>₹${tax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>₹${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Visit Again</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const printKOT = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'चेतावनी',
        description: 'पॉप-अप ब्लॉक है, प्रिंट नहीं हो सका',
        variant: 'destructive'
      })
      return
    }

    const kotNumber = `KOT-${Date.now().toString().slice(-6)}`

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT - ${kotNumber}</title>
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            max-width: 280px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .header h2 {
            margin: 5px 0 0;
            font-size: 14px;
            font-weight: bold;
            color: #666;
          }
          .info {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .items-list {
            margin: 10px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            padding: 5px 0;
            border-bottom: 1px dashed #ccc;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            font-weight: bold;
            font-size: 14px;
          }
          .divider {
            border-top: 2px solid #000;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>★ KITCHEN ORDER TICKET ★</h1>
          <h2>${kotNumber}</h2>
        </div>

        <div class="info">
          <span>Date: ${new Date().toLocaleDateString('en-IN')}</span>
          <span>Time: ${new Date().toLocaleTimeString('en-IN')}</span>
        </div>

        ${tableNumber ? `
          <div class="info">
            <span>Table:</span>
            <span>${tableNumber}</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="items-list">
          ${cart.map(item => `
            <div class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">x${item.quantity}</span>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <div class="footer">
          <p>Total Items: ${cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
          <p>${customerName ? `Customer: ${customerName}` : ''}</p>
          <p>---</p>
          <p>Please prepare this order carefully</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()

    toast({
      title: 'सफल',
      description: `KOT ${kotNumber} प्रिंट हुआ`
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
      <div className="p-6 h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">क्विक बिलिंग</h1>
          <p className="text-gray-600">तेज़ और आसान बिलिंग</p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Menu Items Section */}
          <div className="lg:col-span-2 flex flex-col min-h-0 bg-white rounded-lg shadow">
            {/* Search and Filter */}
            <div className="p-4 border-b space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="आइटम खोजें..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="कैटेगरी" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">सभी कैटेगरीज़</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Menu Items Grid */}
            <ScrollArea className="flex-1">
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map(item => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                    onClick={() => addToCart(item)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-start justify-between gap-2">
                        <span className="flex-1">{item.name}</span>
                        <Plus className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </span>
                        <span className="font-bold text-orange-600">
                          ₹{item.price.toFixed(0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <UtensilsCrossed className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg">कोई आइटम नहीं मिला</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Cart Section */}
          <div className="flex flex-col min-h-0 bg-white rounded-lg shadow">
            {/* Customer Info */}
            <div className="p-4 border-b space-y-3">
              <div>
                <Label htmlFor="customerName">ग्राहक का नाम</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="नाम (वैकल्पिक)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tableNumber">टेबल नंबर</Label>
                  <Input
                    id="tableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">फ़ोन</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="फ़ोन (वैकल्पिक)"
                  />
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg">कार्ट खाली है</p>
                    <p className="text-sm">आइटम जोड़ने के लिए क्लिक करें</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-orange-600">₹{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Totals and Actions */}
            <div className="p-4 border-t space-y-3 bg-gray-50">
              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">सबटोटल:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">टैक्स ({taxRate}%):</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>कुल:</span>
                  <span className="text-orange-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handlePrintKOT}
                  variant="outline"
                  className="w-full"
                  disabled={cart.length === 0}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  KOT प्रिंट करें
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={clearCart}
                    variant="outline"
                    className="flex-1"
                    disabled={cart.length === 0}
                  >
                    साफ़ करें
                  </Button>
                  <Button
                    onClick={handleSaveAndPrint}
                    disabled={saving || cart.length === 0}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        सहेज रहा है...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 mr-2" />
                        सेव और प्रिंट
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
