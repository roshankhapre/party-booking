import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@darshancafe.com";
  const adminPassword = "admin123";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
    },
    create: {
      email: adminEmail,
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`Upserted admin user: ${admin.email}`);

  // Delete old packages
  await prisma.package.deleteMany({
    where: {
      name: {
        in: ["Silver Package", "Gold Package", "Diamond Package"],
      },
    },
  });
  console.log("Deleted old default packages.");

  const packages = [
    // LIMITED PACKAGES (Rooftop)
    {
      name: "Limited Premium",
      pricePerHead: 450,
      minMembers: 20,
      includes: [
        "Welcome Drink",
        "3 Starters (2 Veg + 1 Paneer)",
        "Main Course Unlimited (1 Paneer + 1 Seasonal Veg + Dal + Roti + Rice + 1 Sweet)",
        "Complimentary Achar Papad Salad",
      ],
    },
    {
      name: "Limited Standard",
      pricePerHead: 400,
      minMembers: 20,
      includes: [
        "Welcome Drink",
        "2 Veg Starters",
        "Main Course Unlimited (1 Paneer + 1 Seasonal Veg + Dal + Roti + Rice + 1 Sweet)",
        "Complimentary Achar Papad Salad",
      ],
    },
    {
      name: "Limited Basic",
      pricePerHead: 360,
      minMembers: 15,
      includes: [
        "Welcome Drink",
        "1 Veg Starter",
        "Main Course Unlimited (1 Paneer + 1 Seasonal Veg + Dal + Roti + Rice + 1 Sweet)",
        "Complimentary Achar Papad Salad",
      ],
    },
    {
      name: "Kitty Party Limited",
      pricePerHead: 280,
      minMembers: 10,
      includes: [
        "Welcome Drink",
        "1 Veg Starter",
        "Heavy Meal Unlimited (Chole Bhature OR Cholle Kulche OR Pav Bhaji OR Veg Paratha with Curd OR Dal Makhni with Laccha Paratha + 1 Sweet)",
        "Complimentary Achar Papad Salad",
      ],
    },
    // UNLIMITED PACKAGES (Rooftop)
    {
      name: "Unlimited Premium",
      pricePerHead: 650,
      minMembers: 20,
      includes: [
        "Welcome Drink",
        "3 Starters (2 Veg + 1 Paneer)",
        "Main Course Unlimited (1 Paneer + 1 Seasonal Veg + Dal + Roti + Rice + 1 Sweet)",
        "Complimentary Achar Papad Salad Raita",
      ],
    },
    {
      name: "Unlimited Standard",
      pricePerHead: 550,
      minMembers: 20,
      includes: [
        "Welcome Drink",
        "2 Veg Starters",
        "Main Course Unlimited (1 Paneer + 1 Seasonal Veg + Dal + Roti + Rice + 1 Sweet)",
        "Complimentary Achar Papad Salad Raita",
      ],
    },
    {
      name: "Unlimited Basic",
      pricePerHead: 500,
      minMembers: 15,
      includes: [
        "Welcome Drink",
        "1 Veg Starter",
        "Main Course Unlimited (1 Paneer + 1 Seasonal Veg + Dal + Roti + Rice + 1 Sweet)",
        "Complimentary Achar Papad Salad Raita",
      ],
    },
    {
      name: "Kitty Party Unlimited",
      pricePerHead: 350,
      minMembers: 10,
      includes: [
        "Welcome Drink",
        "1 Veg Starter",
        "Heavy Meal Unlimited (Chole Bhature OR Cholle Kulche OR Pav Bhaji OR Veg Paratha with Curd OR Dal Makhni with Laccha Paratha + 1 Sweet)",
        "Complimentary Achar Papad Salad Raita",
      ],
    },
    // SPECIAL PACKAGES
    {
      name: "Kids Party",
      pricePerHead: 330,
      minMembers: 10,
      includes: [
        "1 Moctail/Cold Drink (Mint Mojito or Blue Lagoon Mojito)",
        "4 Snacks (Noodles/Crispy Corn/Manchurian/Fries/Pizza/Sandwich)",
        "Ice Cream Sweet (Chocolate/Butterscotch/Vanilla)",
        "Additional charges: Paneer ₹20 Mushroom ₹20 Baby Corn ₹20 Capsicum ₹20 Broccoli ₹20",
      ],
    },
    {
      name: "Dal Bati Special",
      pricePerHead: 350,
      minMembers: 15,
      includes: [
        "Dal Bati/Baafle",
        "Kadi/Chaach",
        "Aloo Jeera/Besan Gatte Ki Sabji",
        "Lahsun Chutney/Hari Chutney",
        "Churme ke Laddu/Rave ke Laddu",
        "Complimentary Papad Salad Achar",
      ],
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: {
        pricePerHead: pkg.pricePerHead,
        minMembers: pkg.minMembers,
        includes: JSON.stringify(pkg.includes),
      },
      create: {
        name: pkg.name,
        pricePerHead: pkg.pricePerHead,
        minMembers: pkg.minMembers,
        includes: JSON.stringify(pkg.includes),
        isActive: true,
      },
    });
  }

  console.log("Upserted Darshans Cafe packages.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
