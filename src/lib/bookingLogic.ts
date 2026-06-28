import { BookingType } from '@/lib/constants'

export const EXTRA_HALL_CHARGE = 5000
export const EXTRA_BUFFET_CHARGE_PER_HEAD = 150
export const FULL_HALL_MIN_MEMBERS = 40
export const GST_FOOD = 0.05
export const GST_SERVICES = 0.18

interface CalculateBookingInput {
  bookingType: BookingType
  memberCount: number
  isFullHallRequested: boolean
  buffetRequested: boolean
  packageData?: {
    pricePerHead: number | null
    flatPrice: number | null
    includes: any
  }
}

export function calculateBookingPrice({
  bookingType,
  memberCount,
  isFullHallRequested,
  buffetRequested,
  packageData,
  settings,
  venue = 'Rooftop'
}: CalculateBookingInput & { settings?: Record<string, string>; venue?: string }) {
  if (bookingType === 'TABLE_ONLY') {
    return {
      subtotal: 0,
      extraHallCharge: 0,
      extraBuffetCharge: 0,
      gstFood: 0,
      gstServices: 0,
      total: 0
    }
  }

  // Load configuration from settings or use defaults
  const fullHallMinMembers = settings?.fullHallMinMembers ? Number(settings.fullHallMinMembers) : 40
  const extraHallChargeSetting = settings?.extraHallCharge ? Number(settings.extraHallCharge) : 5000
  const buffetMinMembers = settings?.buffetMinMembers ? Number(settings.buffetMinMembers) : 40
  const extraBuffetChargeSetting = settings?.extraBuffetCharge ? Number(settings.extraBuffetCharge) : 150
  
  const hallChargeRooftop = settings?.hallChargeRooftop ? Number(settings.hallChargeRooftop) : 0
  const hallChargePartyHall = settings?.hallChargePartyHall ? Number(settings.hallChargePartyHall) : 3000

  // PACKAGE LOGIC
  let basePrice = 0
  if (packageData) {
    if (packageData.flatPrice && Number(packageData.flatPrice) > 0) {
      basePrice = Number(packageData.flatPrice)
    } else if (packageData.pricePerHead) {
      basePrice = memberCount * Number(packageData.pricePerHead)
    }
  }

  // Venue specific base hall charge
  const baseHallCharge = venue === 'Party Hall' ? hallChargePartyHall : hallChargeRooftop

  let extraHallCharge = 0
  if (memberCount < fullHallMinMembers && isFullHallRequested) {
    extraHallCharge = extraHallChargeSetting
  }

  const totalHallCharge = baseHallCharge + extraHallCharge

  // Assuming buffet is requested manually for groups < threshold and not included in package
  let extraBuffetCharge = 0
  const isBuffetIncluded = packageData?.includes && Array.isArray(packageData.includes) && 
    (packageData.includes.includes('Basic Buffet') || packageData.includes.includes('Premium Buffet'))

  if (memberCount < buffetMinMembers && buffetRequested && !isBuffetIncluded) {
    extraBuffetCharge = memberCount * extraBuffetChargeSetting
  }

  const subtotal = basePrice + totalHallCharge + extraBuffetCharge
  
  // 5% GST applied to total subtotal (package amount + hall charge + buffet charge)
  const gstTotal = subtotal * 0.05
  
  const total = subtotal + gstTotal

  return {
    subtotal,
    extraHallCharge: totalHallCharge,
    extraBuffetCharge,
    gstFood: gstTotal,
    gstServices: 0,
    total
  }
}

