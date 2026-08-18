# Petrol Pump Attendance API Documentation

This document describes the Next.js backend API endpoints available for both the Web and Android clients.

## Base URL
The API is served from the Next.js server under the `/api` route.
Example: `http://localhost:3000/api`

## Response Format
All JSON endpoints (except reports) follow a standardized response format.

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description"
  }
}
```

---

## 1. Authentication

### Login
Authenticate an admin user and receive a session token.
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "admin-id",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "token": "eyJhb..."
    }
  }
  ```
- **Error Responses**: 
  - `400 Bad Request`: Email and password are required.
  - `401 Unauthorized`: Invalid credentials.

### Logout
Clear the admin session.
- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Authentication**: Required (Cookie or Bearer Token)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {}
  }
  ```

### Get Current User
Get the currently authenticated admin.
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Authentication**: Required (Cookie or Bearer Token)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "admin-id",
      "name": "Admin Name",
      "email": "admin@example.com"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Unauthorized.

---

## 2. Workers API

### Get All Workers
Fetch all active workers (workers without a `deletedAt` timestamp).
- **URL**: `/api/workers`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "worker-id-1",
        "name": "Worker Name",
        "phone": "9876543210",
        "joiningDate": "2024-01-01T00:00:00.000Z",
        "deletedAt": null,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
  ```

### Add Worker
Create a new worker.
- **URL**: `/api/workers`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "Worker Name",
    "phone": "9876543210",
    "joiningDate": "2024-01-01"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "new-worker-id",
      "name": "Worker Name",
      "phone": "9876543210",
      "joiningDate": "2024-01-01T00:00:00.000Z",
      "deletedAt": null,
      ...
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing fields or invalid phone number.

### Get Worker Profile
Get details of a specific worker including statistics and attendance history.
- **URL**: `/api/workers/[id]`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "worker-id",
      "name": "Worker Name",
      "phone": "9876543210",
      "joiningDate": "...",
      "attendances": [
        { "id": "att-1", "date": "...", "status": "PRESENT" }
      ],
      "stats": {
        "totalRecordedDays": 30,
        "presentDays": 28,
        "absentDays": 2,
        "attendancePercentage": 93
      }
    }
  }
  ```

### Update Worker
Update a worker's details.
- **URL**: `/api/workers/[id]`
- **Method**: `PATCH`
- **Authentication**: Required
- **Request Body** (partial updates allowed):
  ```json
  {
    "name": "Updated Name",
    "phone": "new-phone"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "worker-id",
      "name": "Updated Name",
      ...
    }
  }
  ```

### Remove Worker (Soft Delete)
Soft delete a worker. The worker will not appear in current lists but history is preserved.
- **URL**: `/api/workers/[id]`
- **Method**: `DELETE`
- **Authentication**: Required
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "deletedAt": "2026-08-17T12:00:00.000Z"
    }
  }
  ```

---

## 3. Attendance API

### Get Attendance by Date
Fetch attendance records for a specific date.
- **URL**: `/api/attendance?date=YYYY-MM-DD`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `date`: ISO date string or YYYY-MM-DD
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "att-id-1",
        "workerId": "worker-id-1",
        "date": "2026-08-17T00:00:00.000Z",
        "status": "PRESENT",
        "worker": { ... }
      }
    ]
  }
  ```

### Save Attendance
Bulk save attendance records for a given date. Existing records for the date/worker are updated.
- **URL**: `/api/attendance`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "date": "2026-08-17T00:00:00.000Z",
    "records": [
      {
        "workerId": "worker-id-1",
        "status": "PRESENT"
      },
      {
        "workerId": "worker-id-2",
        "status": "ABSENT"
      }
    ]
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "...", "status": "PRESENT", ... }
    ]
  }
  ```

---

## 4. Dashboard API

### Get Dashboard Stats
Get aggregate statistics for the dashboard.
- **URL**: `/api/dashboard`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalWorkers": 15,
      "presentToday": 14,
      "absentToday": 1,
      "attendanceRate": 93
    }
  }
  ```

---

## 5. Reports API

### Download Report
Generates and downloads an Excel file containing attendance reports. Note that this endpoint returns binary data (an Excel file), NOT a JSON object with the standard wrapper, to allow direct file downloads. Error responses still use the standardized JSON format.
- **URL**: `/api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `startDate`: Start date string
  - `endDate`: End date string
- **Success Response (200 OK)**: 
  Returns `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` binary data.
- **Error Response**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Start date and end date are required"
    }
  }
  ```
