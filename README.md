# Namrata Construction Worker Management System

A robust, modern full-stack web application designed for comprehensive worker attendance tracking, daily operational notes, and dynamic reporting for Namrata Construction Private Limited.

## 🚀 Key Features

### ⏱️ Advanced Attendance Tracking
- Mark workers as Present or Absent daily.
- Log precise **Time In** and **Time Out** for each shift (supports overnight shifts).
- Smart validation ensures clean data, while gracefully supporting late check-outs and missing times.
- View real-time daily active worker statistics from the Dashboard.

### 📸 Rich Operational Notes
- Create rich text notes with inline photo integration.
- Admin can instantly take photos using device cameras or upload from galleries **directly inline** while writing notes.
- Notes seamlessly support `Text -> Photo -> Text` flows without losing cursor context.
- Stores uploads efficiently via local API endpoints.

### 📊 Excel Reports Generation
- Powerful, on-the-fly `.xlsx` export engine.
- Generate beautifully formatted daily, weekly, monthly, or custom-date-range attendance reports.
- Automatically calculates and tallies **Working Hours** per shift and **Total Working Days / Hours** per worker.
- Preserves complete historical accuracy, even for workers who have been removed.

### 👷 Worker Management & Trash System
- Manage all active workers with detailed joining dates.
- Soft-delete functionality: Deleted workers are sent to a "Trash" bin, preserving their historical attendance data and reports indefinitely.
- Restore workers easily from the Trash if needed.

### 🔒 Security & Admin Tools
- Fully protected by JWT-based secure authentication (`jose`, `bcrypt`).
- Integrated Settings panel to manage company profiles and admin passwords.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Database ORM:** Prisma Client 
- **Database:** PostgreSQL (Optimized for Neon Serverless)
- **Styling:** Tailwind CSS
- **Icons & UI:** Lucide React
- **Exporting:** SheetJS (`xlsx`)

---

## 💻 Developer Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory. You will need a PostgreSQL connection string and a JWT secret:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/namrata_construction?schema=public"
JWT_SECRET="petrol-pump-secure-key-9988!"
```

### 3. Database Setup
Push the schema to your database and securely generate the Prisma Client:
```bash
npx prisma db push
npx prisma generate
```

*(Optional) Seed the database with initial Admin credentials if necessary.*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the web dashboard.

---

## 🏗️ Architecture & Directories

- `src/app/(dashboard)/`: Protected UI routes (Attendance, Notes, Reports, Settings, Trash).
- `src/app/api/`: RESTful backend endpoints powering Next.js Server Components and Client queries.
- `prisma/schema.prisma`: The single source of truth for PostgreSQL relational database modeling.
- `public/uploads/`: Local storage destination for photos taken via the Notes application.

---

## 📝 Important Notes for Contributors

- **Time Tracking:** Database stores all `timeIn` and `timeOut` times in standardized 24-hour `HH:mm` format string fields, decoupled from timezone-shifting `DateTime` objects, making it incredibly resilient.
- **Transactions:** High-volume sequential updates (like bulk marking attendance) intentionally bypass `prisma.$transaction()` strict time-locks to gracefully support connection-pool limits on serverless databases (like Neon).
- **Prisma Schema:** Always run `npx prisma generate` followed by a Next.js server restart whenever updating the database schema to ensure the cached environment picks up updated types.