import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@darshancafe.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@darshancafe.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('Admin user created')

  // All packages
  const packages = [
    {
      name: 'Limited Premium',
      description: 'LIMITED - Best value with 3 starters',
      pricePerHead: 450,
      minMembers: 20,
      includes: JSON.stringify(['Welcome Drink', '3 Starters (2 Veg + 1 Paneer)', '1 Paneer Sabji', '1 Seasonal Veg', 'Dal', 'Roti', 'Rice', '1 Sweet', 'Complimentary: Achar Papad Salad']),
    },
    {
      name: 'Limited Standard',
      description: 'LIMITED - Great value with 2 starters',
      pricePerHead: 400,
      minMembers: 20,
      includes: JSON.stringify(['Welcome Drink', '2 Veg Starters', '1 Paneer Sabji', '1 Seasonal Veg', 'Dal', 'Roti', 'Rice', '1 Sweet', 'Complimentary: Achar Papad Salad']),
    },
    {
      name: 'Limited Basic',
      description: 'LIMITED - Affordable with 1 starter',
      pricePerHead: 360,
      minMembers: 15,
      includes: JSON.stringify(['Welcome Drink', '1 Veg Starter', '1 Paneer Sabji', '1 Seasonal Veg', 'Dal', 'Roti', 'Rice', '1 Sweet', 'Complimentary: Achar Papad Salad']),
    },
    {
      name: 'Kitty Party Limited',
      description: 'LIMITED - Special kitty party package',
      pricePerHead: 280,
      minMembers: 10,
      includes: JSON.stringify(['Welcome Drink', '1 Veg Starter', 'Heavy Meal Unlimited (Chole Bhature / Cholle Kulche / Pav Bhaji / Veg Paratha with Curd / Dal Makhni with Laccha Paratha)', '1 Sweet', 'Complimentary: Achar Papad Salad']),
    },
    {
      name: 'Unlimited Premium',
      description: 'UNLIMITED - Premium with 3 starters',
      pricePerHead: 650,
      minMembers: 20,
      includes: JSON.stringify(['Welcome Drink', '3 Starters (2 Veg + 1 Paneer)', '1 Paneer Sabji', '1 Seasonal Veg', 'Dal', 'Roti', 'Rice', '1 Sweet', 'Complimentary: Achar Papad Salad Raita']),
    },
    {
      name: 'Unlimited Standard',
      description: 'UNLIMITED - Standard with 2 starters',
      pricePerHead: 550,
      minMembers: 20,
      includes: JSON.stringify(['Welcome Drink', '2 Veg Starters', '1 Paneer Sabji', '1 Seasonal Veg', 'Dal', 'Roti', 'Rice', '1 Sweet', 'Complimentary: Achar Papad Salad Raita']),
    },
    {
      name: 'Unlimited Basic',
      description: 'UNLIMITED - Basic with 1 starter',
      pricePerHead: 500,
      minMembers: 15,
      includes: JSON.stringify(['Welcome Drink', '1 Veg Starter', '1 Paneer Sabji', '1 Seasonal Veg', 'Dal', 'Roti', 'Rice', '1 Sweet', 'Complimentary: Achar Papad Salad Raita']),
    },
    {
      name: 'Kitty Party Unlimited',
      description: 'UNLIMITED - Kitty party special',
      pricePerHead: 350,
      minMembers: 10,
      includes: JSON.stringify(['Welcome Drink', '1 Veg Starter', 'Heavy Meal Unlimited (Chole Bhature / Cholle Kulche / Pav Bhaji / Veg Paratha with Curd / Dal Makhni with Laccha Paratha)', '1 Sweet', 'Complimentary: Achar Papad Salad Raita']),
    },
    {
      name: 'Kids Party',
      description: 'SPECIAL - Fun kids party package',
      pricePerHead: 330,
      minMembers: 10,
      includes: JSON.stringify(['1 Moctail/Cold Drink (Mint Mojito or Blue Lagoon Mojito)', '4 Snacks (Noodles/Crispy Corn/Manchurian/Fries/Pizza/Sandwich)', 'Ice Cream (Chocolate/Butterscotch/Vanilla)', 'Extra: Paneer ₹20 Mushroom ₹20 Baby Corn ₹20 Capsicum ₹20 Broccoli ₹20']),
    },
    {
      name: 'Dal Bati Special',
      description: 'SPECIAL - Traditional Rajasthani Dal Bati',
      pricePerHead: 350,
      minMembers: 15,
      includes: JSON.stringify(['Dal Bati/Baafle', 'Kadi/Chaach', 'Aloo Jeera / Besan Gatte Ki Sabji', 'Lahsun Chutney / Hari Chutney', 'Churme ke Laddu / Rave ke Laddu', 'Complimentary: Papad Salad Achar']),
    },
  ]

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: { ...pkg, isActive: true },
    })
  }
  console.log('All 10 packages created')

  // Seeding Settings
  const settings = [
    { key: 'defaultAdvanceAmount', value: '2000' },
    { key: 'fullHallMinMembers', value: '40' },
    { key: 'extraHallCharge', value: '5000' },
    { key: 'buffetMinMembers', value: '40' },
    { key: 'extraBuffetCharge', value: '150' },
    { key: 'hallChargeRooftop', value: '0' },
    { key: 'hallChargePartyHall', value: '3000' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('All default settings seeded')
  console.log('Seed completed successfully!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
