# Namrata Construction Worker Management System

A robust, modern full-stack web application designed for comprehensive worker attendance tracking, daily operational notes, and dynamic reporting for Namrata Construction Private Limited.

---

## 🚀 Key Features

- **Advanced Attendance Tracking**: Mark workers as Present or Absent daily. Log precise Time In and Time Out for each shift.
- **Rich Operational Notes**: Create rich text notes with inline photo integration. Upload photos directly into notes.
- **Excel Reports Generation**: Powerful, on-the-fly `.xlsx` export engine (Daily, Weekly, Monthly, Custom).
- **Worker Management & Trash System**: Manage active workers. Soft-delete functionality to preserve historical attendance data in Ex-Worker reports.
- **Security & Admin Tools**: Fully protected by JWT-based secure authentication (`jose`, `bcrypt`).

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router - Next 15 compatible)
- **Database ORM:** Prisma Client 
- **Database:** PostgreSQL (Neon Serverless)
- **Styling:** Tailwind CSS
- **Icons & UI:** Lucide React
- **Exporting:** SheetJS (`xlsx`)

---

## 💻 Developer Guide & Onboarding

If you are a new developer joining the project, this section contains everything you need to understand the project structure, how the frontend and backend communicate, and how to start coding.

### 1. Project Setup
```bash
# Install dependencies
npm install

# Setup environment (.env)
# DATABASE_URL="postgresql://username:password@host/db"
# JWT_SECRET="your-secure-secret"

# Sync database and generate Prisma Client
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

### 2. Architecture Overview
This project uses the **Next.js App Router (`src/app`)**. 
- **Frontend UI** lives in `src/app/(dashboard)` and `src/app/login`.
- **Backend APIs** live in `src/app/api`.
- **Database Schema** is managed via Prisma in `prisma/schema.prisma`.

### 3. Understanding Connections: Hooks & Data Fetching
The frontend relies heavily on standard React Hooks (`useState`, `useEffect`) and custom Next.js hooks to communicate with the backend. We do not use third-party state managers like Redux or React Query; everything is kept lightweight using native React patterns.

Here is how the connections map out across the main modules:

#### A. Data Fetching Pattern (`useEffect` + `fetch`)
Almost all dashboard pages use a standard `useEffect` pattern to load initial data from the `/api` routes on mount.
```typescript
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await fetch('/api/endpoint');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  fetchData();
}, []);
```
* **Workers (`/workers`)**: Fetches active workers from `/api/workers`. Uses `useState` for search filtering and modal states.
* **Attendance (`/attendance`)**: Fetches attendance records for the selected date from `/api/attendance?date=...`. Re-fetches whenever `currentDate` changes.
* **Dashboard (`/dashboard`)**: Fetches top-level statistics from `/api/dashboard`.

#### B. Form Submissions & Mutations
State modifications (Creating, Updating, Deleting) are handled via standard asynchronous functions attached to UI buttons, typically managed with a loading state (`isSubmitting` or `isSaving`).
* **Creating a Worker**: Submits via `POST /api/workers`.
* **Updating Attendance**: The frontend tracks modified attendance rows in a `workingRecords` state array, and pushes the entire payload via `POST /api/attendance` when the Admin clicks "Save".
* **Soft Deletion**: Hitting delete on a worker calls `DELETE /api/workers/[id]`. This updates the `deletedAt` timestamp (Soft Delete), moving them to the Trash.
* **Permanent Deletion**: Called via `POST /api/workers/[id]/permanent-delete`. This marks `isArchived = true`, removing them from the Trash UI but preserving their historical records for the Reports engine.

#### C. Next.js Routing Hooks
- `useRouter()` from `next/navigation`: Used for imperative navigation, e.g., redirecting to the dashboard after a successful login (`router.push('/dashboard')`) or refreshing the page state (`router.refresh()`).
- `usePathname()` from `next/navigation`: Used by the `Sidebar` and `MobileNav` components to highlight the currently active navigation link.

### 4. Backend Authentication & Middleware Connection
The app uses a custom JWT authentication implementation.
1. **Login (`/api/auth/login`)**: Validates the Admin, signs a JWT using the `jose` library, and securely stores it in a HTTP-only `session` cookie.
2. **Middleware (`src/proxy.ts`)**: Next.js evaluates this file on every request. It intercepts requests to `/dashboard/*` and `/api/*`, decrypts the `session` cookie, and returns a `401 Unauthorized` or redirects to `/login` if the user is unauthenticated.
3. **Logout (`/api/auth/logout`)**: Destroys the cookie.

### 5. Important Backend Notes
- **Time Tracking**: `timeIn` and `timeOut` are stored in the database as standard 24-hour `HH:mm` string fields. Do **not** attempt to convert these into full ISO `DateTime` objects, as this prevents painful timezone bugs during report generation.
- **Prisma Transactions**: Bulk updates (like attendance saving) loop over standard Prisma calls instead of using `$transaction`. This is intentional to prevent lock timeouts on Serverless database pools (e.g., Neon Postgres).
- **File Uploads**: Notes images are processed in `src/app/api/upload/route.ts` and stored locally in `public/uploads/`. 

### 6. Adding a New Feature?
1. **Database**: Add your model to `prisma/schema.prisma`. Run `npx prisma db push` and `npx prisma generate`. Restart the Next.js dev server.
2. **API Route**: Create `src/app/api/your-feature/route.ts`. 
3. **Frontend Component**: Build your UI in `src/app/(dashboard)/your-feature/page.tsx` and use the `useEffect` fetch pattern to link it up to your new API!