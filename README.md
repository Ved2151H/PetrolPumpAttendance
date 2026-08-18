# Petrol Pump Management System

This repository contains a full-stack Petrol Pump Management System, consisting of a **Web Dashboard** (Next.js) for administrative tasks and a **Mobile Application** (Expo / React Native) for staff or end-users. 

This document serves as a guide for any developer looking to understand the workflow and make modifications to either part of the project.

---

## 🌐 Section 1: Web Application (Admin Dashboard)

The web application is located in the root directory and serves as both the backend API and the administrative frontend.

### Tech Stack
- **Framework:** Next.js (App Router)
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Styling:** Tailwind CSS v4
- **Authentication:** Custom JWT-based (`jose`, `bcrypt`)
- **UI & Charts:** React Hook Form, Recharts, Lucide React

### Web Project Structure
- `src/app/`: Next.js App Router frontend pages and API routes (`/api/*`).
- `prisma/schema.prisma`: Database schema definition.
- `public/`: Static assets.

### Developer Workflow (Web)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory. You will need a PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/petroll_pump?schema=public"
   JWT_SECRET="your-secret-key"
   ```

3. **Database Setup**
   Run the following commands to push the schema to your database and generate the Prisma Client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
   *(If a seed script is provided, you can run `npx prisma db seed` to populate initial data).*

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the web dashboard.

### How to Make Modifications (Web)
- **To add a new database table:** Open `prisma/schema.prisma`, define your new model, and run `npx prisma migrate dev --name <migration_name>`.
- **To add a new API endpoint:** Create a `route.ts` file inside the `src/app/api/<your-route>/` directory.
- **To create a new page:** Create a `page.tsx` file inside `src/app/<your-page-name>/`.

---

## 📱 Section 2: Mobile Application

The mobile application is built using Expo and is located inside the `mobile/` directory. It communicates with the Web Application's API.

### Tech Stack
- **Framework:** React Native with Expo
- **Navigation:** React Navigation (Native Stack, Bottom Tabs)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Data Fetching:** TanStack React Query & Axios
- **Storage:** Expo Secure Store

### Developer Workflow (Mobile)

1. **Navigate to the Mobile Directory**
   ```bash
   cd mobile
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API Connection**
   Since the mobile app runs on an emulator or physical device, it cannot use `localhost` to connect to the local Next.js server. 
   - Find your computer's local IP address (e.g., `192.168.x.x`).
   - Update the API base URL in your Axios/fetch configuration to `http://<YOUR_IP_ADDRESS>:3000`.

4. **Run the Development Server**
   ```bash
   npm start
   ```
   - Press `a` to open on Android Emulator.
   - Press `i` to open on iOS Simulator.
   - Or scan the QR code with the Expo Go app on a physical device.

### How to Make Modifications (Mobile)
- **To add a new Screen:** Create a new component for your screen and register it in your React Navigation stack/tabs configuration.
- **To fetch new data:** Create a custom hook using TanStack React Query (`useQuery` / `useMutation`) that calls your API using Axios.
- **To style components:** Use standard Tailwind CSS classes via the `className` prop, provided by NativeWind.
