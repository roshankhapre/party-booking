# Deployment Guide

## Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Darshan's Party Booking System"
git remote add origin https://github.com/YOUR_USERNAME/darshhans-booking.git
git push -u origin main
```

## Step 2: Setup Neon PostgreSQL (Free)
- Go to neon.tech
- Create account and new project: "darshans-booking"
- Copy the connection string
- Change `prisma/schema.prisma` provider from `"sqlite"` to `"postgresql"`

## Step 3: Deploy on Vercel (Free)
- Go to vercel.com
- Import GitHub repo
- Add these environment variables:
  - `DATABASE_URL` = (your neon connection string)
  - `NEXTAUTH_SECRET` = darshans-secret-2025-indore
  - `NEXTAUTH_URL` = https://your-app.vercel.app
  - `WHATSAPP_API_TOKEN` = (your token later)
  - `WHATSAPP_PHONE_NUMBER_ID` = (your id later)
  - `WHATSAPP_ADMIN_NUMBER` = (your number)

## Step 4: After first deploy run once:
```bash
npx vercel env pull .env.local
npx prisma db push
npx tsx prisma/seed.ts
```
