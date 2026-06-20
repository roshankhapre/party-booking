import { prisma } from '@/lib/prisma'
import { formatINR } from '@/lib/utils'
import Link from 'next/link'
import { Check } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const dynamic = 'force-dynamic'

export default async function PackagesPage() {
  const allPackages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { pricePerHead: 'asc' }
  })

  // Categorize packages based on name
  const limitedPackages = allPackages.filter(p => p.name.toLowerCase().includes('limited') && !p.name.toLowerCase().includes('unlimited'))
  const unlimitedPackages = allPackages.filter(p => p.name.toLowerCase().includes('unlimited'))
  const specialPackages = allPackages.filter(p => !p.name.toLowerCase().includes('limited'))

  const renderPackageGroup = (title: string, packages: typeof allPackages) => {
    if (packages.length === 0) return null;

    return (
      <div className="mb-24 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white tracking-tight">
          {title} <span className="text-amber-500">Packages</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            let includes = []
            try {
              includes = pkg.includes ? JSON.parse(pkg.includes) : []
            } catch (e) {
              includes = typeof pkg.includes === 'string' ? pkg.includes.split(',').map(s => s.trim()) : []
            }

            return (
              <div key={pkg.id} className="group relative flex flex-col rounded-3xl bg-zinc-900/80 border border-zinc-800/80 shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.3)] backdrop-blur-md overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="p-8 flex flex-col h-full">
                  <h3 className="text-2xl font-black text-amber-500 mb-2">{pkg.name}</h3>
                  {pkg.description && <p className="text-sm text-zinc-400 mb-6">{pkg.description}</p>}
                  
                  <div className="mt-4 mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">
                        {pkg.flatPrice ? formatINR(pkg.flatPrice) : formatINR(pkg.pricePerHead!)}
                      </span>
                      <span className="text-zinc-500 font-medium">
                        {pkg.flatPrice ? ' flat' : ' / head'}
                      </span>
                    </div>
                    <div className="inline-flex items-center mt-3 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300">
                      Minimum {pkg.minMembers} Members
                    </div>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-4 text-left">
                      {includes.map((inc: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <Check className="h-3 w-3 text-amber-500" strokeWidth={3} />
                            </div>
                          </div>
                          <span className="text-sm text-zinc-300 leading-tight">{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8 mt-auto">
                    <Link href={`/booking/new?packageId=${pkg.id}`} className="block w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-center transition-colors duration-300 shadow-lg shadow-amber-500/25">
                      Book This Package
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-amber-500/30 pb-20">
      {/* Hero */}
      <section className="relative py-28 px-4 flex flex-col items-center text-center overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
            Our Party <span className="text-amber-500">Packages</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Choose the perfect culinary experience for your celebration. All packages can be tailored to your specific needs.
          </p>
        </div>
      </section>

      {/* Packages Grids */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        {renderPackageGroup("Limited", limitedPackages)}
        {renderPackageGroup("Unlimited", unlimitedPackages)}
        {renderPackageGroup("Special", specialPackages)}

        {allPackages.length === 0 && (
          <div className="text-center py-20 text-zinc-500 text-lg">
            No packages are currently available. Please check back later.
          </div>
        )}
      </div>

      {/* Terms and Conditions Accordion */}
      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="terms" className="border-zinc-800 border bg-zinc-900/50 rounded-2xl px-6 data-[state=open]:border-amber-500/50 transition-colors">
            <AccordionTrigger className="text-xl font-bold text-white hover:text-amber-400 py-6 hover:no-underline">
              Terms & Conditions
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <ul className="list-disc pl-5 space-y-3 text-zinc-400 font-light">
                <li>Advance payment is non-refundable</li>
                <li>Outside food not allowed</li>
                <li>Children above age 5 years (3 feet) counted as 1 member</li>
                <li>Event duration 3 hours</li>
                <li>Alcoholic drinks and smoking prohibited</li>
                <li>Decoration charges extra</li>
                <li>No packing/parcel available during party</li>
                <li>After 3 hours ₹1000 per hour extra charge</li>
                <li>Payment taken for minimum members fixed at time of booking</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
