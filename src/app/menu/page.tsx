'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Loader2,
  Save
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  description?: string
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  category?: Category
  isActive: boolean
}

export default function MenuManagementPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiInput, setAiInput] = useState('')

  // Add Item Form State
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: ''
  })

  // Add Category Form State
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu-items')
      ])

      const categoriesData = await categoriesRes.json()
      const itemsData = await itemsRes.json()

      setCategories(categoriesData.data || [])
      setMenuItems(itemsData.data || [])
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

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'त्रुटि',
        description: 'कैटेगरी का नाम आवश्यक है',
        variant: 'destructive'
      })
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (!res.ok) throw new Error('Failed to create category')

      await fetchData()
      setNewCategory({ name: '', description: '' })
      setShowCategoryDialog(false)
      toast({
        title: 'सफल',
        description: 'कैटेगरी जोड़ी गई'
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'कैटेगरी जोड़ने में विफल',
        variant: 'destructive'
      })
    }
  }

  const handleAddMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.categoryId) {
      toast({
        title: 'त्रुटि',
        description: 'सभी आवश्यक फ़ील्ड भरें',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price)
        })
      })

      if (!res.ok) throw new Error('Failed to create menu item')

      await fetchData()
      setNewItem({ name: '', description: '', price: '', categoryId: '' })
      setShowAddDialog(false)
      toast({
        title: 'सफल',
        description: 'मेनू आइटम जोड़ा गया'
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'मेनू आइटम जोड़ने में विफल',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('क्या आप इस आइटम को हटाना चाहते हैं?')) return

    try {
      const res = await fetch(`/api/menu-items/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete item')

      await fetchData()
      toast({
        title: 'सफल',
        description: 'आइटम हटा दिया गया'
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'आइटम हटाने में विफल',
        variant: 'destructive'
      })
    }
  }

  const handleAIGenerate = async () => {
    if (!aiInput.trim()) {
      toast({
        title: 'त्रुटि',
        description: 'कृपया कम से कम एक आइटम प्रकार लिखें',
        variant: 'destructive'
      })
      return
    }

    setAiGenerating(true)
    try {
      const res = await fetch('/api/menu-items/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiInput })
      })

      if (!res.ok) throw new Error('Failed to generate items')

      const data = await res.json()

      if (data.items && data.items.length > 0) {
        // Save generated items
        const savePromises = data.items.map((item: any) =>
          fetch('/api/menu-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          })
        )

        await Promise.all(savePromises)
        await fetchData()
        setShowAIDialog(false)
        setAiInput('')
        toast({
          title: 'सफल',
          description: `${data.items.length} मेनू आइटम्स AI से जोड़े गए`
        })
      } else {
        toast({
          title: 'चेतावनी',
          description: 'कोई आइटम नहीं बनाया जा सका',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'AI से आइटम बनाने में विफल',
        variant: 'destructive'
      })
    } finally {
      setAiGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">मेनू मैनेजमेंट</h1>
            <p className="text-gray-600 mt-1">अपने रेस्टोरेंट के मेनू को प्रबंधित करें</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCategoryDialog(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              कैटेगरी जोड़ें
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              आइटम जोड़ें
            </Button>
            <Button
              onClick={() => setShowAIDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI से जोड़ें
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                कुल कैटेगरीज़
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {categories.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                कुल मेनू आइटम्स
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {menuItems.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                सक्रिय आइटम्स
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {menuItems.filter(i => i.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>मेनू आइटम्स</CardTitle>
            </CardHeader>
            <CardContent>
              {menuItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">कोई मेनू आइटम नहीं है</p>
                  <p className="text-sm">ऊपर दिए गए बटन से नया आइटम जोड़ें</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {menuItems.map((item) => {
                      const category = categories.find(c => c.id === item.categoryId)
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900">{item.name}</h3>
                              {!item.isActive && (
                                <span className="px-2 py-0.5 text-xs bg-gray-300 text-gray-700 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                {category?.name || 'No Category'}
                              </span>
                              <span className="text-lg font-bold text-orange-600">
                                ₹{item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleDeleteItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>नया मेनू आइटम जोड़ें</DialogTitle>
              <DialogDescription>
                नया मेनू आइटम जोड़ने के लिए नीचे दिए गए फ़ील्ड भरें
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">आइटम का नाम *</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="जैसे: पनीर टिक्का"
                />
              </div>
              <div>
                <Label htmlFor="category">कैटेगरी *</Label>
                <Select
                  value={newItem.categoryId}
                  onValueChange={(value) => setNewItem({ ...newItem, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="कैटेगरी चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">कीमत (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="description">विवरण</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="आइटम का विवरण..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                रद्द करें
              </Button>
              <Button
                onClick={handleAddMenuItem}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    सहेज रहा है...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    सहेजें
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>नई कैटेगरी जोड़ें</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="catName">कैटेगरी का नाम *</Label>
                <Input
                  id="catName"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="जैसे: स्टार्टर्स"
                />
              </div>
              <div>
                <Label htmlFor="catDesc">विवरण</Label>
                <Textarea
                  id="catDesc"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="कैटेगरी का विवरण..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                रद्द करें
              </Button>
              <Button
                onClick={handleAddCategory}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                जोड़ें
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Generate Dialog */}
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI से मेनू आइटम बनाएं
              </DialogTitle>
              <DialogDescription>
                AI से bulk में मेनू आइटम्स बनाएं। बस बताएं कि क्या चाहिए।
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="aiInput">आइटम्स की जानकारी</Label>
                <Textarea
                  id="aiInput"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="उदाहरण: इंडियन डिशेज: दाल मखनी, पनीर टिक्का, बटर चिकन"
                  rows={4}
                />
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-700">
                <p className="font-medium mb-2">उदाहरण:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>"चाइनीज फूड: नूडल्स, फ्राइड राइस"</li>
                  <li>"ड्रिंक्स: मोजिटो, मिंट मोजिटो"</li>
                  <li>"डेज़र्ट: चॉकलेट केक, आइसक्रीम"</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                रद्द करें
              </Button>
              <Button
                onClick={handleAIGenerate}
                disabled={aiGenerating}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    बना रहा है...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    बनाएं
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

function Package({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
}
