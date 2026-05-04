import { BookingForm } from "@/components/booking/BookingForm"

export const metadata = {
  title: 'Admin - New Walk-in Booking',
}

export default function AdminNewBookingPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin: Walk-in Booking</h1>
        <p className="text-muted-foreground mt-1">
          Create a new booking manually on behalf of a customer.
        </p>
      </div>
      <div className="bg-card shadow-sm border border-border rounded-xl">
        <BookingForm isAdmin={true} />
      </div>
    </div>
  )
}
