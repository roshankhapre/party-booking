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
  packageData
}: CalculateBookingInput) {
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

  // PACKAGE LOGIC
  let basePrice = 0
  if (packageData) {
    if (packageData.flatPrice && Number(packageData.flatPrice) > 0) {
      basePrice = Number(packageData.flatPrice)
    } else if (packageData.pricePerHead) {
      basePrice = memberCount * Number(packageData.pricePerHead)
    }
  }

  let extraHallCharge = 0
  if (memberCount < FULL_HALL_MIN_MEMBERS && isFullHallRequested) {
    extraHallCharge = EXTRA_HALL_CHARGE
  }

  // Assuming buffet is requested manually for groups < 40 and not included in package
  let extraBuffetCharge = 0
  const isBuffetIncluded = packageData?.includes && Array.isArray(packageData.includes) && 
    (packageData.includes.includes('Basic Buffet') || packageData.includes.includes('Premium Buffet'))

  if (memberCount < FULL_HALL_MIN_MEMBERS && buffetRequested && !isBuffetIncluded) {
    extraBuffetCharge = memberCount * EXTRA_BUFFET_CHARGE_PER_HEAD
  }

  const subtotal = basePrice + extraHallCharge + extraBuffetCharge
  
  // simplified GST: apply food GST to base price (assuming it's mostly food) + extra buffet
  // apply services GST to hall charge
  const gstFood = (basePrice + extraBuffetCharge) * GST_FOOD
  const gstServices = (extraHallCharge) * GST_SERVICES
  
  const total = subtotal + gstFood + gstServices

  return {
    subtotal,
    extraHallCharge,
    extraBuffetCharge,
    gstFood,
    gstServices,
    total
  }
}
