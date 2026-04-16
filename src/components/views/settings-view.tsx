'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Settings as SettingsIcon,
  Building2,
  Printer,
  Percent,
  Save,
  Loader2,
  TestTube,
  Bluetooth,
  Check
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SettingsData {
  id: string
  restaurantName: string
  address: string
  phone: string
  gstNumber: string
  taxRate: number
  currency: string
  printerType: string
  printerName: string | null
  paperWidth: number
  kotCopies: number
  billCopies: number
  showLogo: boolean
}

export function SettingsView() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [settings, setSettings] = useState<SettingsData>({
    id: '',
    restaurantName: '',
    address: '',
    phone: '',
    gstNumber: '',
    taxRate: 0,
    currency: '₹',
    printerType: 'thermal',
    printerName: null,
    paperWidth: 80,
    kotCopies: 1,
    billCopies: 1,
    showLogo: true
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()

      if (data.data) {
        setSettings(data.data)
      }
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'सेटिंग्स लोड करने में विफल',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!res.ok) throw new Error('Failed to save settings')

      toast({
        title: 'सफल',
        description: 'सेटिंग्स सहेजी गईं'
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'सेटिंग्स सहेजने में विफल',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestPrint = async () => {
    setPrinting(true)
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({
          title: 'चेतावनी',
          description: 'पॉप-अप ब्लॉक है',
          variant: 'destructive'
        })
        return
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Print</title>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              padding: 10px;
              max-width: ${settings.paperWidth}mm;
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
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .test-line {
              text-align: center;
              padding: 5px;
              font-weight: bold;
              font-size: 14px;
            }
            .info {
              margin: 5px 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${settings.restaurantName || 'Restaurant'}</h1>
            <p>${settings.address || ''}</p>
            <p>${settings.phone || ''}</p>
          </div>

          <div class="test-line">
            ★ TEST PRINT ★
          </div>

          <div class="divider"></div>

          <div class="info">
            <p><strong>Date:</strong> ${new Date().toLocaleString('en-IN')}</p>
            <p><strong>Printer Type:</strong> ${settings.printerType}</p>
            <p><strong>Paper Width:</strong> ${settings.paperWidth}mm</p>
            <p><strong>Currency:</strong> ${settings.currency}</p>
            <p><strong>Tax Rate:</strong> ${settings.taxRate}%</p>
          </div>

          <div class="divider"></div>

          <div class="test-line">
            ✓ PRINT SUCCESSFUL ✓
          </div>

          <div style="text-align: center; margin-top: 15px; font-size: 10px;">
            <p>If you can see this, your printer is working!</p>
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
        description: 'टेस्ट प्रिंट भेजा गया'
      })
    } catch (error) {
      toast({
        title: 'त्रुटि',
        description: 'टेस्ट प्रिंट विफल',
        variant: 'destructive'
      })
    } finally {
      setPrinting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">सेटिंग्स</h1>
          <p className="text-gray-600 mt-1">अपनी प्राथमिकताएँ कॉन्फ़िगर करें</p>
        </div>
        <Button
          onClick={handleSave}
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
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="w-4 h-4 mr-2" />
            सामान्य
          </TabsTrigger>
          <TabsTrigger value="printer">
            <Printer className="w-4 h-4 mr-2" />
            प्रिंटर
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Percent className="w-4 h-4 mr-2" />
            टैक्स
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                रेस्टोरेंट की जानकारी
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="restaurantName">रेस्टोरेंट का नाम *</Label>
                <Input
                  id="restaurantName"
                  value={settings.restaurantName}
                  onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                  placeholder="My Restaurant"
                />
              </div>

              <div>
                <Label htmlFor="address">पता</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="पूरा पता यहाँ लिखें..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">फ़ोन नंबर</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST नंबर</Label>
                  <Input
                    id="gstNumber"
                    value={settings.gstNumber}
                    onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showLogo">लोगो दिखाएं</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    बिल पर लोगो दिखाएं या छुपाएं
                  </p>
                </div>
                <Switch
                  id="showLogo"
                  checked={settings.showLogo}
                  onCheckedChange={(checked) => setSettings({ ...settings, showLogo: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                प्रिंटर सेटिंग्स
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="printerType">प्रिंटर प्रकार</Label>
                <Select
                  value={settings.printerType}
                  onValueChange={(value) => setSettings({ ...settings, printerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">थर्मल प्रिंटर</SelectItem>
                    <SelectItem value="bluetooth">ब्लूटूथ प्रिंटर</SelectItem>
                    <SelectItem value="network">नेटवर्क प्रिंटर</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.printerType === 'bluetooth' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Bluetooth className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">ब्लूटूथ प्रिंटर</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    अपने ब्लूटूथ प्रिंटर को डिवाइस से पेयर करें।
                  </p>
                  <div>
                    <Label htmlFor="printerName">प्रिंटर नाम</Label>
                    <Input
                      id="printerName"
                      value={settings.printerName || ''}
                      onChange={(e) => setSettings({ ...settings, printerName: e.target.value })}
                      placeholder="BT Printer"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="paperWidth">पेपर चौड़ाई (mm)</Label>
                <Select
                  value={settings.paperWidth.toString()}
                  onValueChange={(value) => setSettings({ ...settings, paperWidth: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm (Small)</SelectItem>
                    <SelectItem value="80">80mm (Standard)</SelectItem>
                    <SelectItem value="76">76mm (Mini)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kotCopies">KOT कॉपीज़</Label>
                  <Input
                    id="kotCopies"
                    type="number"
                    min="1"
                    max="5"
                    value={settings.kotCopies}
                    onChange={(e) => setSettings({ ...settings, kotCopies: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="billCopies">बिल कॉपीज़</Label>
                  <Input
                    id="billCopies"
                    type="number"
                    min="1"
                    max="5"
                    value={settings.billCopies}
                    onChange={(e) => setSettings({ ...settings, billCopies: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currency">करेंसी</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => setSettings({ ...settings, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="₹">₹ (INR)</SelectItem>
                    <SelectItem value="$">$ (USD)</SelectItem>
                    <SelectItem value="€">€ (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleTestPrint}
                  variant="outline"
                  className="w-full"
                  disabled={printing}
                >
                  {printing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      प्रिंट हो रहा है...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      टेस्ट प्रिंट
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                टैक्स सेटिंग्स
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taxRate">टैक्स दर (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  यह टैक्स हर बिल पर लगाया जाएगा। GST के लिए 18, केंद्रीय टैक्स के लिए 9, आदि।
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">आम टैक्स दरें:</h4>
                <ul className="space-y-1 text-sm text-orange-700">
                  <li>• 0% - टैक्स मुक्त</li>
                  <li>• 5% - निम्न टैक्स</li>
                  <li>• 12% - मध्यम टैक्स</li>
                  <li>• 18% - मानक GST</li>
                  <li>• 28% - उच्च GST</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">उदाहरण:</h4>
                <p className="text-sm text-gray-700">
                  यदि आपका सबटोटल ₹1,000 है और टैक्स दर 18% है, तो:
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-600">सबटोटल: ₹1,000</p>
                  <p className="text-gray-600">टैक्स (18%): ₹180</p>
                  <p className="font-semibold text-orange-600">कुल: ₹1,180</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
