'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const nav = [
    { href: '/admin', label: '📊 Dashboard' },
    { href: '/admin/bookings', label: '📋 Bookings' },
    { href: '/admin/calendar', label: '📅 Calendar' },
    { href: '/admin/packages', label: '📦 Packages' },
    { href: '/admin/settings', label: '⚙️ Settings' },
  ]
  return (
    <div className="flex min-h-screen">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-bold">Darshan Cafe</div>
          <div className="text-xs text-gray-400">Manager Portal</div>
        </div>
        <button onClick={() => setOpen(!open)} className="text-2xl p-1">{open ? '✕' : '☰'}</button>
      </div>
      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="relative bg-gray-900 w-64 h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="mb-6 mt-10">
              <div className="font-bold text-white text-lg">Darshan Cafe</div>
            </div>
            <nav className="space-y-1 flex-1">
              {nav.map(i => (
                <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
                  className="block px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 text-sm">
                  {i.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-700 pt-3 space-y-1">
              <Link href="/" target="_blank" onClick={() => setOpen(false)}
                className="block px-3 py-3 text-gray-400 text-sm">🌐 View Website</Link>
              <a href="/api/auth/signout" className="block px-3 py-3 text-red-400 text-sm">🚪 Sign Out</a>
            </div>
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gray-900 text-white fixed h-full z-30">
        <div className="p-5 border-b border-gray-700">
          <div className="font-bold text-lg">Darshan Cafe</div>
          <div className="text-gray-400 text-xs mt-1">Manager Portal</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(i => (
            <Link key={i.href} href={i.href}
              className="block px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 text-sm">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <Link href="/" target="_blank" className="block px-3 py-2 text-gray-400 text-sm">🌐 View Website</Link>
          <a href="/api/auth/signout" className="block px-3 py-2 text-red-400 text-sm">🚪 Sign Out</a>
        </div>
      </aside>
      {/* Content */}
      <main className="flex-1 md:ml-60 bg-gray-50 mt-14 md:mt-0 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}