"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/admin/login' })} 
      className="flex w-full items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl font-medium transition-colors"
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </button>
  )
}
