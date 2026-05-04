"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatINR } from "@/lib/utils"
import { Plus, Edit2, Trash2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingPkg, setEditingPkg] = useState<any>(null)
  const router = useRouter()

  const fetchPackages = async () => {
    setLoading(true)
    const res = await fetch("/api/packages")
    const data = await res.json()
    setPackages(data.packages || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      pricePerHead: formData.get("pricePerHead"),
      minMembers: formData.get("minMembers"),
      includes: formData.get("includes")?.toString().split(',').map(s => s.trim()).filter(Boolean) || [],
      isActive: formData.get("isActive") === "on",
    }

    try {
      const url = editingPkg ? `/api/packages/${editingPkg.id}` : "/api/packages"
      const method = editingPkg ? "PATCH" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      setOpen(false)
      setEditingPkg(null)
      fetchPackages()
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return

    try {
      await fetch(`/api/packages/${id}`, {
        method: "DELETE",
      })
      fetchPackages()
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Packages</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove your party offerings.</p>
        </div>
        
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val)
          if (!val) setEditingPkg(null)
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" /> Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingPkg ? "Edit Package" : "Add New Package"}</DialogTitle>
              <DialogDescription>
                {editingPkg ? "Modify the package details below." : "Create a new package offering for your customers."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Silver Package" defaultValue={editingPkg?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Brief description of the package" defaultValue={editingPkg?.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerHead">Price per Head</Label>
                  <Input id="pricePerHead" name="pricePerHead" type="number" required placeholder="e.g. 500" defaultValue={editingPkg?.pricePerHead} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minMembers">Min. Members</Label>
                  <Input id="minMembers" name="minMembers" type="number" required defaultValue={editingPkg?.minMembers || "1"} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="includes">Includes (comma-separated)</Label>
                <Input id="includes" name="includes" placeholder="e.g. Welcome Drink, 2 Veg Starters" defaultValue={editingPkg?.includes?.join(', ')} />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="isActive" name="isActive" defaultChecked={editingPkg ? editingPkg.isActive : true} className="h-4 w-4 rounded border-gray-300 text-primary" />
                <Label htmlFor="isActive">Active (Visible to customers)</Label>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Saving..." : "Save Package"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading packages...</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl bg-muted/20 border-dashed">
          <p className="text-muted-foreground">No packages found. Add your first package to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="relative flex flex-col rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className={`absolute top-0 left-0 w-full h-1 ${pkg.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold line-clamp-1" title={pkg.name}>{pkg.name}</h3>
                    <Badge variant={pkg.isActive ? 'default' : 'secondary'} className="mt-1">
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-primary">
                      {pkg.flatPrice ? formatINR(pkg.flatPrice) : formatINR(pkg.pricePerHead)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {pkg.flatPrice ? 'Flat' : 'Per Head'}
                    </div>
                  </div>
                </div>
                
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pkg.description}</p>
                )}
                
                <div className="bg-muted/50 rounded-xl p-3 mb-4 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Minimum Requirement</span>
                  <span className="font-semibold">{pkg.minMembers} Members</span>
                </div>

                <div className="flex-1 mb-6">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    Package Includes
                  </h4>
                  <ul className="space-y-2">
                    {pkg.includes?.slice(0, 4).map((inc: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-1" title={inc}>{inc}</span>
                      </li>
                    ))}
                    {(pkg.includes?.length || 0) > 4 && (
                      <li className="text-xs text-muted-foreground font-medium pl-6">
                        + {pkg.includes.length - 4} more items...
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setEditingPkg(pkg)
                    setOpen(true)
                  }}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleDelete(pkg.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
