import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { pricePerHead: 'asc' }
    })

    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      includes: pkg.includes ? JSON.parse(pkg.includes) : []
    }))

    return NextResponse.json({ packages: formattedPackages })
  } catch (error) {
    console.error('GET packages error:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, pricePerHead, flatPrice, minMembers, includes, isActive } = body

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        pricePerHead: Number(pricePerHead) || 0,
        flatPrice: flatPrice ? Number(flatPrice) : null,
        minMembers: Number(minMembers) || 1,
        includes: Array.isArray(includes) ? JSON.stringify(includes) : JSON.stringify(includes?.split(',').map((s: string) => s.trim()).filter(Boolean) || []),
        isActive: isActive !== undefined ? isActive : true,
      }
    })

    return NextResponse.json({ package: newPackage }, { status: 201 })
  } catch (error) {
    console.error('POST package error:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
