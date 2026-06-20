export const dynamic = 'force-dynamic'

import { DashboardStats } from "@/components/admin/DashboardStats"

export default function AdminDashboardPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, here's what's happening today.</p>
      </div>
      <DashboardStats />
    </div>
  )
}
