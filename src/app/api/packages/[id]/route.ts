import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: params.id }
    });
    
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    
    return NextResponse.json(pkg);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, description, pricePerHead, flatPrice, minMembers, includes, isActive } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (pricePerHead !== undefined) dataToUpdate.pricePerHead = Number(pricePerHead) || 0;
    if (flatPrice !== undefined) dataToUpdate.flatPrice = flatPrice ? Number(flatPrice) : null;
    if (minMembers !== undefined) dataToUpdate.minMembers = Number(minMembers) || 1;
    if (includes !== undefined) {
      dataToUpdate.includes = Array.isArray(includes) 
        ? JSON.stringify(includes) 
        : JSON.stringify(includes?.split(',').map((s: string) => s.trim()).filter(Boolean) || []);
    }
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const pkg = await prisma.package.update({
      where: { id: params.id },
      data: dataToUpdate
    });
    return NextResponse.json(pkg);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const pkg = await prisma.package.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true, package: pkg });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
