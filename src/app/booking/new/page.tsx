import { BookingForm } from "@/components/booking/BookingForm"

export const metadata = {
  title: 'New Booking | Antigravity',
}

export default function NewBookingPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Create a New Booking</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Fill out the details below to initialize a new party booking request.
          </p>
        </div>
        <div className="bg-card shadow-sm border border-border rounded-xl">
          <BookingForm />
        </div>
      </div>
    </div>
  )
}
