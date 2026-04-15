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
  Save,
  Upload,
  RefreshCw,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  sortOrder: number
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  category?: Category
  isActive: boolean
  hasVariations?: boolean
}

export default function MenuManagementPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  
  // AI and Image states
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [imageDetecting, setImageDetecting] = useState(false)
  const [detectedItems, setDetectedItems] = useState<MenuItem[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  
  // Add Item Form State
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: ''
  })
  
  // Edit Item Form State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editItemData, setEditItemData] = useState({
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
  
  // Edit Category Form State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryData, setEditCategoryData] = useState({
    name: '',
    description: ''
  })

  // Live sync - auto refresh data every 10 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchData(true) // true = silent refresh (no loading state)
      }, 10000) // Refresh every 10 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu-items')
      ])

      const categoriesData = await categoriesRes.json()
      const itemsData = await itemsRes.json()

      setCategories(categoriesData.data || [])
      setMenuItems(itemsData.data || [])
    } catch (error) {
      if (!silent) {
        toast({
          title: 'त्रुटि',
          description: 'डेटा लोड करने में विफल',
          variant: 'destructive'
        })
      }
    } finally {
      if (!silent) setLoading(false)
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

    setSaving(true)
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
    } finally {
      setSaving(false)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editCategoryData.name.trim()) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCategoryData)
      })

      if (!res.ok) throw new Error('Failed to update category')

      await fetchData()
      setEditingCategory(null)
      setEditCategoryData({ name: '', description: '' })
      setShowEditCategoryDialog(false)
      toast({
        title: 'सफल',
        description: 'कैटेगरी अपडेट हो गई'
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'कैटेगरी अपडेट करने में विफल',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`क्या आप "${name}" कैटेगरी को हटाना चाहते हैं?`)) return

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      await fetchData()
      toast({
        title: 'सफल',
        description: 'कैटेगरी हटा दी गई'
      })
    } catch (error: any) {
      toast({
        title: 'त्रुटि',
        description: error.message || 'कैटेगरी हटाने में विफल',
        variant: 'destructive'
      })
    }
  }

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryData({
      name: category.name,
      description: category.description || ''
    })
    setShowEditCategoryDialog(true)
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

  const openEditItemDialog = (item: MenuItem) => {
    setEditingItem(item)
    setEditItemData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId
    })
    setShowEditDialog(true)
  }

  const handleEditMenuItem = async () => {
    if (!editingItem || !editItemData.name || !editItemData.price) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/menu-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editItemData,
          price: parseFloat(editItemData.price)
        })
      })

      if (!res.ok) throw new Error('Failed to update menu item')

      await fetchData()
      setEditingItem(null)
      setEditItemData({ name: '', description: '', price: '', categoryId: '' })
      setShowEditDialog(false)
      toast({
        title: 'सफल',
        description: 'मेनू आइटम अपडेट हो गया'
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'मेनू आइटम अपडेट करने में विफल',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`क्या आप "${name}" आइटम को हटाना चाहते हैं?`)) return

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageDetect = async () => {
    if (!selectedImage) {
      toast({
        title: 'त्रुटि',
        description: 'कृपया एक चित्र चुनें',
        variant: 'destructive'
      })
      return
    }

    setImageDetecting(true)
    setDetectedItems([])

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const res = await fetch('/api/menu-items/image-detect', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Failed to detect items')

      const data = await res.json()
      
      if (data.items && data.items.length > 0) {
        setDetectedItems(data.items)
        toast({
          title: 'सफल',
          description: `${data.detected} मेनू आइटम्स पता चुके हैं`
        })
      } else {
        toast({
          title: 'चेतावनी',
          description: 'चित्र में कोई मेनू आइटम्स नहीं पता चला',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'चित्र से आइटम पहचाने में विफल',
        variant: 'destructive'
      })
    } finally {
      setImageDetecting(false)
    }
  }

  const handleSaveDetectedItems = async () => {
    if (detectedItems.length === 0) return

    setSaving(true)
    try {
      const savePromises = detectedItems.map((item: any) =>
        fetch('/api/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
      )

      await Promise.all(savePromises)
      await fetchData()
      setShowImageDialog(false)
      setSelectedImage(null)
      setImagePreview('')
      setDetectedItems([])
      toast({
        title: 'सफल',
        description: `${detectedItems.length} मेनू आइटम्स सहेज़ किए गए`
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'आइटम्स सहेज़ करने में विफल',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
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
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fetchData()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              रिफ्रेश
            </Button>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'लाइव सिंक' : 'ऑटो सिंक'}
            </Button>
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
            <Button
              onClick={() => setShowImageDialog(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              फोटो से जोड़ें
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

        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle>कैटेगरीज़</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description || 'कोई विवरण नहीं'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openEditCategoryDialog(category)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

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
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openEditItemDialog(item)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

        {/* Edit Item Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>आइटम संपादित करें</DialogTitle>
              <DialogDescription>
                {editingItem?.name} को अपडेट करें
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">आइटम का नाम *</Label>
                <Input
                  id="editName"
                  value={editItemData.name}
                  onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                  placeholder="जैसे: पनीर टिक्का"
                />
              </div>
              <div>
                <Label htmlFor="editCategory">कैटेगरी *</Label>
                <Select
                  value={editItemData.categoryId}
                  onValueChange={(value) => setEditItemData({ ...editItemData, categoryId: value })}
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
                <Label htmlFor="editPrice">कीमत (₹) *</Label>
                <Input
                  id="editPrice"
                  type="number"
                  step="0.01"
                  value={editItemData.price}
                  onChange={(e) => setEditItemData({ ...editItemData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">विवरण</Label>
                <Textarea
                  id="editDescription"
                  value={editItemData.description}
                  onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                  placeholder="आइटम का विवरण..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                रद्द करें
              </Button>
              <Button
                onClick={handleEditMenuItem}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    अपडेट हो रहा है...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    अपडेट करें
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
                    जोड़ें
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>कैटेगरी संपादित करें</DialogTitle>
              <DialogDescription>
                {editingCategory?.name} को अपडेट करें
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCatName">कैटेगरी का नाम *</Label>
                <Input
                  id="editCatName"
                  value={editCategoryData.name}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                  placeholder="जैसे: स्टार्टर्स"
                />
              </div>
              <div>
                <Label htmlFor="editCatDesc">विवरण</Label>
                <Textarea
                  id="editCatDesc"
                  value={editCategoryData.description}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                  placeholder="कैटेगरी का विवरण..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>
                रद्द करें
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    अपडेट हो रहा है...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    अपडेट करें
                  </>
                )}
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
                AI से मेनू आइटम्स बनाएं
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

        {/* Image Detect Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                फोटो से मेनू आइटम्स पहचानें
              </DialogTitle>
              <DialogDescription>
                मेनू फोटो या रेस्टोरेंट का चित्र अपलोड करें, AI स्वचालित रूप से आइटम्स को पहचानेगी
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="imageUpload"
                />
                <label htmlFor="imageUpload" className="cursor-pointer">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-gray-600">फोटो चुनें या यहाँ ड्रैग करें</p>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF (MAX 5MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Detected Items */}
              {detectedItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {detectedItems.length} आइटम्स पता चुके हैं:
                  </h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {detectedItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white rounded border"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                          <p className="text-lg font-bold text-orange-600">
                            ₹{item.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImageDialog(false)
                  setSelectedImage(null)
                  setImagePreview('')
                  setDetectedItems([])
                }}
              >
                <X className="w-4 h-4 mr-2" />
                बंद करें
              </Button>
              {detectedItems.length > 0 ? (
                <Button
                  onClick={handleSaveDetectedItems}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      सहेज रहा है...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      सभी सहेजें ({detectedItems.length})
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleImageDetect}
                  disabled={imageDetecting || !selectedImage}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {imageDetecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      पहचान में है...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      पहचानें
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
