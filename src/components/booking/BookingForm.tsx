"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Package } from "@prisma/client"
import { PartyType, BookingType, TimeSlot } from "@/lib/constants"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { formatINR } from "@/lib/utils"
import { useForm as useHookForm } from "react-hook-form"
import { Loader2, Calendar } from "lucide-react"

const bookingSchema = z.object({
  partyType: z.nativeEnum(PartyType),
  eventDate: z.string().min(1, "Date is required"),
  eventTimeSlot: z.nativeEnum(TimeSlot),
  memberCount: z.coerce.number().min(5, "Minimum 5 members required"),
  bookingType: z.nativeEnum(BookingType),
  packageId: z.string().optional(),
  isFullHall: z.boolean().default(false),
  buffetRequested: z.boolean().default(false),
  venue: z.string().default("Rooftop"),
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  customerEmail: z.string().email("Valid email required").or(z.literal("")),
  specialRequests: z.string().optional(),
  welcomeDrink: z.string().optional(),
  starter: z.string().optional(),
  paneerVeg: z.string().optional(),
  seasonalVeg: z.string().optional(),
  sweet: z.string().optional(),
  dal: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
})

type FormValues = z.infer<typeof bookingSchema>

export function BookingForm({ isAdmin }: { isAdmin?: boolean } = {}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [packages, setPackages] = useState<Package[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [settings, setSettings] = useState<Record<string, string>>({
    defaultAdvanceAmount: "2000",
    fullHallMinMembers: "40",
    extraHallCharge: "5000",
    buffetMinMembers: "40",
    extraBuffetCharge: "150",
    hallChargeRooftop: "0",
    hallChargePartyHall: "3000",
  })

  const form = useHookForm<FormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      partyType: PartyType.BIRTHDAY,
      eventDate: '',
      eventTimeSlot: TimeSlot.EVENING,
      memberCount: 10,
      bookingType: BookingType.PACKAGE,
      isFullHall: false,
      buffetRequested: false,
      venue: 'Rooftop',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      specialRequests: '',
      welcomeDrink: '',
      starter: '',
      paneerVeg: '',
      seasonalVeg: '',
      sweet: '',
      dal: '',
      termsAccepted: false
    }
  })

  const { watch, setValue } = form
  const wBookingType = watch('bookingType')
  const wMemberCount = watch('memberCount')
  const wPackageId = watch('packageId')
  const wVenue = watch('venue')

  useEffect(() => {
    async function fetchPackagesAndSettings() {
      setLoadingPackages(true)
      try {
        // Fetch packages
        const resPkg = await fetch('/api/packages')
        const dataPkg = await resPkg.json()
        setPackages(dataPkg.packages || [])

        // Fetch settings
        const resSet = await fetch('/api/settings')
        const dataSet = await resSet.json()
        if (dataSet.success && dataSet.settings) {
          setSettings(prev => ({ ...prev, ...dataSet.settings }))
        }
      } catch (err) {
        console.error("Failed to fetch initial packages/settings")
      }
      setLoadingPackages(false)
    }
    fetchPackagesAndSettings()
  }, [])

  // Auto-select package food items when package is chosen
  useEffect(() => {
    if (!wPackageId || packages.length === 0) return
    const pkg = packages.find(p => p.id === wPackageId)
    if (!pkg) return

    const pkgIncludes = pkg.includes ? (typeof pkg.includes === 'string' ? JSON.parse(pkg.includes) : pkg.includes) : []
    const incString = JSON.stringify(pkgIncludes).toLowerCase()

    // 1. Welcome Drink
    if (incString.includes('welcome drink')) {
      setValue('welcomeDrink', 'Tomato Soup')
    } else {
      setValue('welcomeDrink', '')
    }

    // 2. Starter
    if (incString.includes('starter')) {
      setValue('starter', 'Veg. Kothey')
    } else {
      setValue('starter', '')
    }

    // 3. Paneer Sabji
    if (incString.includes('paneer')) {
      setValue('paneerVeg', 'Paneer Chatpata')
    } else {
      setValue('paneerVeg', '')
    }

    // 4. Seasonal Veg
    if (incString.includes('seasonal') || incString.includes('veg')) {
      setValue('seasonalVeg', 'Mix Veg')
    } else {
      setValue('seasonalVeg', '')
    }

    // 5. Sweet
    if (incString.includes('sweet')) {
      setValue('sweet', 'Gulab Jamun')
    } else {
      setValue('sweet', '')
    }

    // 6. Dal
    if (incString.includes('dal')) {
      setValue('dal', 'Dal Tadka')
    } else {
      setValue('dal', '')
    }
  }, [wPackageId, packages, setValue])

  const nextStep = () => {
    const fieldsToValidate = getFieldsForStep(step)
    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) setStep(s => Math.min(s + 1, 6))
    })
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const getFieldsForStep = (s: number) => {
    switch (s) {
      case 1: return ['partyType']
      case 2: return ['eventDate', 'eventTimeSlot']
      case 3: return ['memberCount', 'bookingType', 'venue']
      case 4: return wBookingType === BookingType.PACKAGE ? ['packageId'] : []
      case 5: return ['customerName', 'customerPhone', 'customerEmail']
      case 6: return ['termsAccepted']
      default: return []
    }
  }

  const calculatePreview = () => {
    const defaultAdvance = Number(settings.defaultAdvanceAmount || 2000)

    if (wBookingType === BookingType.TABLE_ONLY) {
      return { total: null, advance: defaultAdvance, note: "Final bill on day of event via Petpooja POS" }
    }
    
    let base = 0
    const pkg = packages.find(p => p.id === wPackageId)
    if (pkg) {
      if (pkg.flatPrice && Number(pkg.flatPrice) > 0) base = Number(pkg.flatPrice)
      else if (pkg.pricePerHead) base = wMemberCount * Number(pkg.pricePerHead)
    }
    
    // Hall Charge: Rooftop vs Party Hall + Extra Hall Charge if members below minimum
    const baseHall = wVenue === 'Party Hall' ? Number(settings.hallChargePartyHall || 3000) : Number(settings.hallChargeRooftop || 0)
    
    const minMembersHall = Number(settings.fullHallMinMembers || 40)
    const extraHallAmt = Number(settings.extraHallCharge || 5000)
    
    let extraHall = (wMemberCount < minMembersHall && watch('isFullHall')) ? extraHallAmt : 0
    const totalHallCharge = baseHall + extraHall
    
    // Buffet Charge
    const minMembersBuffet = Number(settings.buffetMinMembers || 40)
    const extraBuffetAmt = Number(settings.extraBuffetCharge || 150)
    
    let extraBuffet = (wMemberCount < minMembersBuffet && watch('buffetRequested') && pkg && !(pkg.includes || '').includes('Basic Buffet')) ? wMemberCount * extraBuffetAmt : 0
    
    const sub = base + totalHallCharge + extraBuffet
    const gstTotal = sub * 0.05 // 5% GST on the sum of all charges
    const total = sub + gstTotal
    
    return { total, advance: defaultAdvance, sub, extraHall: totalHallCharge, extraBuffet, gstFood: gstTotal, gstServ: 0 }
  }

  const getPkgIncludes = () => {
    const pkg = packages.find(p => p.id === wPackageId)
    if (!pkg) return []
    try {
      return pkg.includes ? (typeof pkg.includes === 'string' ? JSON.parse(pkg.includes) : pkg.includes) : []
    } catch {
      return []
    }
  }

  const isCategoryIncluded = (category: string) => {
    if (wBookingType === BookingType.TABLE_ONLY) return false
    const pkgInc = getPkgIncludes()
    const incString = JSON.stringify(pkgInc).toLowerCase()
    
    if (category === 'welcomeDrink') return incString.includes('welcome drink')
    if (category === 'starter') return incString.includes('starter')
    if (category === 'paneerVeg') return incString.includes('paneer')
    if (category === 'seasonalVeg') return (incString.includes('seasonal') || incString.includes('veg'))
    if (category === 'sweet') return incString.includes('sweet')
    if (category === 'dal') return incString.includes('dal')
    return false
  }

  async function onSubmit(data: FormValues) {
    if (step !== 6) {
      nextStep();
      return;
    }
    
    setSubmitting(true)
    try {
      const selectionsObj = {
        venue: data.venue || "Rooftop",
        welcomeDrink: data.welcomeDrink || undefined,
        starter: data.starter || undefined,
        paneerVeg: data.paneerVeg || undefined,
        seasonalVeg: data.seasonalVeg || undefined,
        sweet: data.sweet || undefined,
        dal: data.dal || undefined,
        specialRequests: data.specialRequests || undefined
      }

      const payload = { 
        ...data, 
        specialRequests: JSON.stringify(selectionsObj) 
      }
      
      // Remove extra fields not in schema
      delete (payload as any).welcomeDrink
      delete (payload as any).starter
      delete (payload as any).paneerVeg
      delete (payload as any).seasonalVeg
      delete (payload as any).sweet
      delete (payload as any).dal
      delete (payload as any).termsAccepted
      delete (payload as any).venue

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      
      if (res.ok) {
        toast({ title: "Booking Created Successfully!" })
        router.push(isAdmin ? `/admin/bookings/${result.booking.id}` : `/booking/${result.booking.bookingCode}`)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit booking", variant: "destructive" })
    }
    setSubmitting(false)
  }

  const preview = step === 6 ? calculatePreview() : null

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Book Your Party</h2>
        <div className="flex gap-1 md:gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={`h-1 md:h-2 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if(step < 6) nextStep(); } }} className="space-y-6">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Party Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.values(PartyType).map(type => (
                  <div 
                    key={type}
                    className={`border p-4 rounded-xl cursor-pointer text-center transition-all ${watch('partyType') === type ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                    onClick={() => setValue('partyType', type)}
                  >
                    <div className="font-semibold text-sm">{type.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Date & Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="eventDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Date</FormLabel>
                    <FormControl><Input type="date" {...field} min={new Date().toISOString().split('T')[0]} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="eventTimeSlot" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Slot" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="MORNING">Morning: 11 AM - 2 PM</SelectItem>
                        <SelectItem value="AFTERNOON">Afternoon: 1 PM - 4 PM</SelectItem>
                        <SelectItem value="EVENING">Evening: 4 PM - 7 PM</SelectItem>
                        <SelectItem value="NIGHT">Night: 7 PM - 10 PM</SelectItem>
                        <SelectItem value="LATE_NIGHT">Late Night: 8 PM - 11 PM</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">Note: Event duration 3 hours. Extra ₹1000/hour after that.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Event Details</h3>
              <FormField control={form.control} name="memberCount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Guests</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-4">
                 <h3 className="text-lg font-medium">Booking Type</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div 
                      className={`border p-6 rounded-xl cursor-pointer transition-all ${wBookingType === BookingType.PACKAGE ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border hover:bg-muted'}`}
                      onClick={() => setValue('bookingType', BookingType.PACKAGE)}
                    >
                      <h4 className="font-bold text-lg mb-2">Package Booking</h4>
                      <p className="text-sm text-muted-foreground">Pre-select food, decoration & hall. Pay fixed amount based on package. Best for organized events.</p>
                    </div>
                    <div 
                      className={`border p-6 rounded-xl cursor-pointer transition-all ${wBookingType === BookingType.TABLE_ONLY ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border hover:bg-muted'}`}
                      onClick={() => setValue('bookingType', BookingType.TABLE_ONLY)}
                    >
                      <h4 className="font-bold text-lg mb-2">Table Only Booking</h4>
                      <p className="text-sm text-muted-foreground">Reserve tables or area. Order food à la carte from menu on the day. Advance ₹{settings.defaultAdvanceAmount} required.</p>
                    </div>
                 </div>
              </div>

              {wBookingType === BookingType.PACKAGE && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Venue & Extras</h3>
                  <FormField control={form.control} name="venue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Venue</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Venue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Rooftop">Rooftop (Hall Charge: ₹{settings.hallChargeRooftop})</SelectItem>
                          <SelectItem value="Party Hall">Party Hall (Hall Charge: ₹{settings.hallChargePartyHall})</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="mt-4 p-4 border rounded-xl bg-muted/30 space-y-4">
                    {wMemberCount >= Number(settings.fullHallMinMembers || 40) ? (
                      <p className="text-sm font-semibold text-green-600">✅ Full Hall included. Buffet available.</p>
                    ) : (
                      <>
                        <p className="text-sm text-amber-600 font-medium">
                          ℹ️ Below {settings.fullHallMinMembers} members. Full hall has extra charge of ₹{settings.extraHallCharge}. Buffet has extra charge of ₹{settings.extraBuffetCharge}/head.
                        </p>
                        <FormField control={form.control} name="isFullHall" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                            <FormControl>
                              <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300 text-primary" />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Request Full Hall (+₹{settings.extraHallCharge})</FormLabel>
                            </div>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="buffetRequested" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                            <FormControl>
                              <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300 text-primary" />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Request Buffet Setup (+₹{settings.extraBuffetCharge}/head)</FormLabel>
                            </div>
                          </FormItem>
                        )} />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              {wBookingType === BookingType.TABLE_ONLY ? (
                <div className="p-6 bg-muted rounded-xl">
                  <h3 className="text-lg font-medium mb-2">Table Only Selected</h3>
                  <p className="text-muted-foreground mb-4">You have opted to order from the live menu on the day of the event. A fixed advance is required to confirm this booking.</p>
                  <div className="font-bold text-xl">Advance Amount: {formatINR(Number(settings.defaultAdvanceAmount || 2000))}</div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-medium">Select Package</h3>
                  {loadingPackages ? <div className="text-center p-8"><Loader2 className="animate-spin mx-auto text-primary" /></div> : (
                    <div className="grid gap-4">
                      {packages.map(pkg => (
                        <div 
                          key={pkg.id}
                          className={`border p-4 rounded-xl cursor-pointer flex justify-between items-center ${wPackageId === pkg.id ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'hover:border-primary/50'}`}
                          onClick={() => setValue('packageId', pkg.id)}
                        >
                          <div>
                            <div className="font-bold">{pkg.name} <span className="text-sm font-normal text-muted-foreground">(Min {pkg.minMembers} members)</span></div>
                            <div className="text-sm text-muted-foreground mt-1 max-w-md">{pkg.description}</div>
                            {wMemberCount < pkg.minMembers && (
                              <div className="text-xs text-amber-500 font-semibold mt-1">⚠️ Minimum recommended: {pkg.minMembers} members</div>
                            )}
                          </div>
                          <div className="text-xl font-bold whitespace-nowrap">
                            {pkg.flatPrice ? `${formatINR(Number(pkg.flatPrice))} Flat` : `${formatINR(Number(pkg.pricePerHead))} / head`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Details & Menu</h3>
              <div className="grid gap-4">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="customerPhone" render={({ field }) => (
                  <FormItem><FormLabel>WhatsApp Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="customerEmail" render={({ field }) => (
                  <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                {wBookingType === BookingType.PACKAGE && (
                  <>
                    <h4 className="font-semibold text-lg mt-6 pt-4 border-t flex items-center gap-2">🍽️ Food Menu Customization</h4>
                    
                    <div className="grid grid-cols-1 gap-6 mt-2">
                      {/* Welcome Drink */}
                      <FormField control={form.control} name="welcomeDrink" render={({ field }) => (
                        <FormItem className="border p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="font-bold">Welcome Drink (choose 1)</FormLabel>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCategoryIncluded('welcomeDrink') ? 'bg-green-500/10 text-green-600 font-semibold' : 'bg-amber-500/10 text-amber-600 font-semibold'}`}>
                              {isCategoryIncluded('welcomeDrink') ? '✅ Included in package' : '⚠️ Additional charge'}
                            </span>
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Drink" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {['Tomato Soup', 'Hot n Sour Soup', 'Mint Mojito', 'Blue Lagoon Mojito', 'Manchow Soup', 'Chai', 'Coffee', 'Butter Milk', 'Lassi'].map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Starter */}
                      <FormField control={form.control} name="starter" render={({ field }) => (
                        <FormItem className="border p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="font-bold">Starter (choose based on package)</FormLabel>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCategoryIncluded('starter') ? 'bg-green-500/10 text-green-600 font-semibold' : 'bg-amber-500/10 text-amber-600 font-semibold'}`}>
                              {isCategoryIncluded('starter') ? '✅ Included in package' : '⚠️ Additional charge'}
                            </span>
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Starter" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {['Veg. Kothey', 'Veg. Lolipop', 'Honey Chilli Potato', 'Crispy Corn', 'Munchurian', 'Noodles', 'Hakka Noodles', 'Hara Bhara Kebab', 'Mix Pakoda'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Paneer Sabji */}
                      <FormField control={form.control} name="paneerVeg" render={({ field }) => (
                        <FormItem className="border p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="font-bold">Paneer Sabji (choose 1)</FormLabel>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCategoryIncluded('paneerVeg') ? 'bg-green-500/10 text-green-600 font-semibold' : 'bg-amber-500/10 text-amber-600 font-semibold'}`}>
                              {isCategoryIncluded('paneerVeg') ? '✅ Included in package' : '⚠️ Additional charge'}
                            </span>
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Paneer Sabji" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {['Paneer Chatpata', 'Paneer Lababder', 'Paneer Kohlapuri', 'Paneer Masala', 'Matar Paneer', 'Chole Paneer', 'Paneer Punjabi', 'Corn Paneer', 'Paneer do Pyaza'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Seasonal Veg */}
                      <FormField control={form.control} name="seasonalVeg" render={({ field }) => (
                        <FormItem className="border p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="font-bold">Seasonal Veg (choose 1)</FormLabel>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCategoryIncluded('seasonalVeg') ? 'bg-green-500/10 text-green-600 font-semibold' : 'bg-amber-500/10 text-amber-600 font-semibold'}`}>
                              {isCategoryIncluded('seasonalVeg') ? '✅ Included in package' : '⚠️ Additional charge'}
                            </span>
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Seasonal Veg" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {['Mix Veg', 'Bhindi Masala', 'Chana Masala', 'Sev Masala', 'Corn Palak', 'Aloo Gobhi', 'Veg Handi', 'Aloo Matar', 'Aloo Jeera', 'Aloo Chole', 'Matar Masala', 'Tawa Veg', 'Aloo Methi'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Dal */}
                      <FormField control={form.control} name="dal" render={({ field }) => (
                        <FormItem className="border p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="font-bold">Dal (choose 1)</FormLabel>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCategoryIncluded('dal') ? 'bg-green-500/10 text-green-600 font-semibold' : 'bg-amber-500/10 text-amber-600 font-semibold'}`}>
                              {isCategoryIncluded('dal') ? '✅ Included in package' : '⚠️ Additional charge'}
                            </span>
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Dal" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {['Dal Tadka', 'Dal Makhani', 'Dal Fry', 'Panchmel Dal'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Sweet */}
                      <FormField control={form.control} name="sweet" render={({ field }) => (
                        <FormItem className="border p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="font-bold">Sweet (choose 1)</FormLabel>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCategoryIncluded('sweet') ? 'bg-green-500/10 text-green-600 font-semibold' : 'bg-amber-500/10 text-amber-600 font-semibold'}`}>
                              {isCategoryIncluded('sweet') ? '✅ Included in package' : '⚠️ Additional charge'}
                            </span>
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Sweet" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {['Gulab Jamun', 'Rasgulla', 'Kheer', 'Halwa', 'Ice Cream'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </>
                )}
                
                <FormField control={form.control} name="specialRequests" render={({ field }) => (
                  <FormItem className="mt-4"><FormLabel>Special Requests / Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && preview && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review & Confirm</h3>
              <Card className="shadow-none">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-xl">{watch('partyType').replace(/_/g, ' ')} - {wBookingType === BookingType.PACKAGE ? 'Package Booking' : 'Table Booking'}</CardTitle>
                  <CardDescription>{watch('eventDate')} | {watch('eventTimeSlot').replace(/_/g, ' ')} | Guests: {wMemberCount} | Venue: {wVenue}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-muted-foreground">Customer</div><div className="font-medium text-right">{watch('customerName')}</div>
                    <div className="text-muted-foreground">Phone</div><div className="font-medium text-right">{watch('customerPhone')}</div>
                    
                    {wBookingType === BookingType.PACKAGE && preview.total !== null && (
                      <>
                        <div className="col-span-2 my-2 border-t" />
                        <div className="text-muted-foreground">Subtotal (Pkg + Hall + Buffet)</div><div className="font-medium text-right">{formatINR(preview.sub)}</div>
                        <div className="text-muted-foreground">GST (5%)</div><div className="font-medium text-right">{formatINR(preview.gstFood || 0)}</div>
                        <div className="col-span-2 my-2 border-t" />
                        <div className="text-muted-foreground font-bold text-base">Total Estimated</div><div className="font-bold text-base text-right">{formatINR(preview.total)}</div>
                      </>
                    )}
                  </div>

                  <div className="p-4 bg-primary/10 rounded-xl mt-4 flex justify-between items-center border border-primary/20">
                    <span className="font-medium text-primary">Advance Required Today</span>
                    <span className="font-bold text-xl text-primary">{formatINR(preview.advance)}</span>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
                    <h4 className="font-bold mb-2 text-sm">Terms & Conditions</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground mb-4">
                      <li>Advance payment is non-refundable</li>
                      <li>Outside food not allowed</li>
                      <li>Children above age 5 years (3 feet) counted as 1 member</li>
                      <li>Event duration 3 hours. After 3 hours ₹1000 per hour extra charge.</li>
                      <li>Alcoholic drinks and smoking prohibited</li>
                      <li>Decoration charges extra</li>
                      <li>No packing/parcel available during party</li>
                      <li>Payment taken for minimum members fixed at time of booking</li>
                    </ul>
                    <FormField control={form.control} name="termsAccepted" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2 border-t mt-4 border-border">
                        <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 mt-1 rounded border-gray-300 text-primary" /></FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I accept all terms and conditions</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-6 border-t mt-8">
            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1 || submitting}>
              Back
            </Button>
            {step < 6 ? (
              <Button type="button" onClick={nextStep}>Next Step</Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Confirm Booking
              </Button>
            )}
          </div>

        </form>
      </Form>
    </div>
  )
}
