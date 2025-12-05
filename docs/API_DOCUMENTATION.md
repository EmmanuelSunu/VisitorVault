# VisitorVault - API Documentation

## Base URL

### Development
```
http://visitvault.test/api
```

### Production
```
https://your-domain.com/api
```

---

## Authentication

### Overview
VisitorVault uses **Laravel Sanctum** for token-based authentication.

### Authentication Flow
1. User logs in via `/api/login`
2. Server returns authentication token
3. Client stores token (localStorage/sessionStorage)
4. Client includes token in subsequent requests via `Authorization` header

### Authorization Header Format
```
Authorization: Bearer {token}
```

---

## Public Endpoints

### 1. User Login
**POST** `/api/login`

Authenticate a user and receive an access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "host",
    "created_at": "2025-01-01T00:00:00.000000Z"
  },
  "token": "1|abc123def456..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

---

### 2. User Registration
**POST** `/api/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "host"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "host",
    "created_at": "2025-01-01T00:00:00.000000Z"
  },
  "token": "1|abc123def456..."
}
```

---

### 3. Register Visitor (Public)
**POST** `/api/visitor/register`

Register a new visitor (public endpoint).

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company_id": 1,
  "purpose": "Meeting",
  "photo": "base64_encoded_image_string",
  "host_id": 5
}
```

**Response (201 Created):**
```json
{
  "visitor": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company_id": 1,
    "purpose": "Meeting",
    "photo": "/storage/photos/visitor_1.jpg",
    "qr_code": "VIS-001-ABC123",
    "badge_number": "BADGE-001",
    "status": "pending",
    "host_id": 5,
    "created_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

---

### 4. Find Visitor by Email or Phone
**POST** `/api/visitor/find-by-email-or-phone`

Find existing visitor by email or phone number.

**Request Body:**
```json
{
  "email": "jane@example.com"
}
```
OR
```json
{
  "phone": "+1234567890"
}
```

**Response (200 OK):**
```json
{
  "visitor": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "status": "approved"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Visitor not found"
}
```

---

### 5. Create Visit for Visitor
**POST** `/api/visitor/{visitor}/create-visit`

Create a new visit for an existing visitor.

**URL Parameters:**
- `visitor`: Visitor ID

**Request Body:**
```json
{
  "visit_date": "2025-01-15",
  "user_id": 5,
  "purpose": "Follow-up meeting",
  "notes": "Second floor conference room"
}
```

**Response (201 Created):**
```json
{
  "visit": {
    "id": 1,
    "visitor_id": 1,
    "user_id": 5,
    "visit_date": "2025-01-15",
    "purpose": "Follow-up meeting",
    "notes": "Second floor conference room",
    "check_in_time": null,
    "check_out_time": null,
    "created_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

---

### 6. List Companies
**GET** `/api/companies`

Get list of all companies.

**Response (200 OK):**
```json
{
  "companies": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "created_at": "2025-01-01T00:00:00.000000Z"
    },
    {
      "id": 2,
      "name": "TechStart Inc",
      "created_at": "2025-01-02T00:00:00.000000Z"
    }
  ]
}
```

---

### 7. Test API Connection
**GET** `/api/test`

Simple endpoint to test API connectivity.

**Response (200 OK):**
```json
{
  "message": "Hello World"
}
```

---

## Protected Endpoints

All endpoints below require authentication via Bearer token.

### User Management

#### 1. Get Current User
**GET** `/api/me`

Get currently authenticated user information.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "role": "host",
  "created_at": "2025-01-01T00:00:00.000000Z"
}
```

---

#### 2. Logout
**POST** `/api/logout`

Revoke current authentication token.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### 3. List Users
**GET** `/api/users`

Get list of all users (admin only).

**Query Parameters:**
- `role` (optional): Filter by role (admin, host, reception)
- `status` (optional): Filter by status (active, inactive)

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "host",
      "status": "active",
      "created_at": "2025-01-01T00:00:00.000000Z"
    }
  ]
}
```

---

#### 4. Create User
**POST** `/api/users`

Create a new user (admin only).

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "reception"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 10,
    "name": "New User",
    "email": "newuser@example.com",
    "role": "reception",
    "status": "active",
    "created_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

---

#### 5. Get User
**GET** `/api/users/{id}`

Get specific user details.

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "host",
    "status": "active",
    "created_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

---

#### 6. Update User
**PUT** `/api/users/{id}`

Update user information.

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "admin",
    "updated_at": "2025-01-05T00:00:00.000000Z"
  }
}
```

---

#### 7. Delete User
**DELETE** `/api/users/{id}`

Delete a user.

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

---

#### 8. Toggle User Status
**PATCH** `/api/users/{id}/toggle-status`

Toggle user active/inactive status.

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "status": "inactive",
    "updated_at": "2025-01-05T00:00:00.000000Z"
  }
}
```

---

### Dashboard

#### 1. Get Dashboard Statistics
**GET** `/api/dashboard`

Get dashboard statistics and overview.

**Response (200 OK):**
```json
{
  "stats": {
    "total_visitors": 150,
    "pending_approvals": 5,
    "checked_in_now": 8,
    "total_visits_today": 25
  },
  "recent_visitors": [...],
  "upcoming_visits": [...]
}
```

---

#### 2. Get Activity Logs
**GET** `/api/activity-logs`

Get system activity logs.

**Query Parameters:**
- `limit` (optional): Number of records (default: 50)
- `date` (optional): Filter by date (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "logs": [
    {
      "id": 1,
      "action": "visitor_checked_in",
      "visitor_name": "Jane Smith",
      "user_name": "John Doe",
      "timestamp": "2025-01-01T10:30:00.000000Z"
    }
  ]
}
```

---

### Visitor Management

#### 1. List Visitors
**GET** `/api/visitors`

Get list of all visitors with filtering.

**Query Parameters:**
- `status` (optional): pending, approved, rejected
- `search` (optional): Search by name, email, phone
- `company_id` (optional): Filter by company
- `page` (optional): Page number for pagination
- `per_page` (optional): Results per page (default: 15)

**Response (200 OK):**
```json
{
  "visitors": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "phone": "+1234567890",
        "company": {
          "id": 1,
          "name": "Acme Corp"
        },
        "status": "approved",
        "badge_number": "BADGE-001",
        "created_at": "2025-01-01T00:00:00.000000Z"
      }
    ],
    "total": 150,
    "per_page": 15,
    "last_page": 10
  }
}
```

---

#### 2. Get Currently Checked-In Visitors
**GET** `/api/visitors/checked-in`

Get list of currently checked-in visitors.

**Response (200 OK):**
```json
{
  "visitors": [
    {
      "id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "badge_number": "BADGE-001",
      "check_in_time": "2025-01-01T09:00:00.000000Z",
      "host": {
        "id": 5,
        "name": "John Doe"
      }
    }
  ]
}
```

---

#### 3. Search Visitors
**GET** `/api/visitors/search`

Search visitors by various criteria.

**Query Parameters:**
- `q`: Search query (name, email, phone, badge)

**Response (200 OK):**
```json
{
  "visitors": [...]
}
```

---

#### 4. Find Visitor by Badge
**GET** `/api/visitors/badge/{badgeNumber}`

Find visitor by badge number.

**Response (200 OK):**
```json
{
  "visitor": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "badge_number": "BADGE-001"
  }
}
```

---

#### 5. Get Visitor Details
**GET** `/api/visitor/{visitor}`

Get detailed information about a specific visitor.

**Response (200 OK):**
```json
{
  "visitor": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company": {...},
    "visits": [...],
    "status": "approved"
  }
}
```

---

#### 6. Update Visitor
**PATCH** `/api/visitor/{visitor}`

Update visitor information.

**Request Body:**
```json
{
  "status": "approved",
  "badge_number": "BADGE-002",
  "notes": "VIP visitor"
}
```

**Response (200 OK):**
```json
{
  "visitor": {
    "id": 1,
    "status": "approved",
    "badge_number": "BADGE-002",
    "updated_at": "2025-01-05T00:00:00.000000Z"
  }
}
```

---

#### 7. Delete Visitor
**DELETE** `/api/visitor/{visitor}`

Delete a visitor record.

**Response (200 OK):**
```json
{
  "message": "Visitor deleted successfully"
}
```

---

### Visit Management

#### 1. List Visits
**GET** `/api/visits`

Get list of visits with filtering.

**Query Parameters:**
- `visitor_id` (optional): Filter by visitor
- `user_id` (optional): Filter by host
- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): checked_in, checked_out, scheduled
- `page` (optional): Page number
- `per_page` (optional): Results per page

**Response (200 OK):**
```json
{
  "visits": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "visitor": {
          "id": 1,
          "first_name": "Jane",
          "last_name": "Smith"
        },
        "host": {
          "id": 5,
          "name": "John Doe"
        },
        "visit_date": "2025-01-15",
        "check_in_time": "2025-01-15T09:00:00.000000Z",
        "check_out_time": null,
        "notes": "Conference room B"
      }
    ],
    "total": 200
  }
}
```

---

#### 2. Create Visit
**POST** `/api/visits`

Create a new visit.

**Request Body:**
```json
{
  "visitor_id": 1,
  "user_id": 5,
  "visit_date": "2025-01-15",
  "notes": "Meeting in conference room A",
  "badge_number": "BADGE-001"
}
```

**Response (201 Created):**
```json
{
  "visit": {
    "id": 1,
    "visitor_id": 1,
    "user_id": 5,
    "visit_date": "2025-01-15",
    "created_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

---

#### 3. Get Currently Checked-In Visits
**GET** `/api/visits/checked-in`

Get all currently active (checked-in) visits.

**Response (200 OK):**
```json
{
  "visits": [
    {
      "id": 1,
      "visitor": {...},
      "host": {...},
      "check_in_time": "2025-01-15T09:00:00.000000Z",
      "duration_minutes": 45
    }
  ]
}
```

---

#### 4. Get Visit Statistics
**GET** `/api/visits/statistics`

Get visit statistics and analytics.

**Query Parameters:**
- `start_date` (optional): Start date for range
- `end_date` (optional): End date for range

**Response (200 OK):**
```json
{
  "statistics": {
    "total_visits": 500,
    "avg_duration_minutes": 65,
    "peak_hours": [9, 10, 14],
    "visits_by_day": {...},
    "visits_by_company": {...}
  }
}
```

---

#### 5. Check In Visitor
**POST** `/api/visits/check-in-visitor`

Check in a visitor (creates visit if needed).

**Request Body:**
```json
{
  "visitor_id": 1,
  "badge_number": "BADGE-001"
}
```

**Response (200 OK):**
```json
{
  "visit": {
    "id": 1,
    "check_in_time": "2025-01-15T09:00:00.000000Z",
    "visitor": {...}
  },
  "message": "Visitor checked in successfully"
}
```

---

#### 6. Check Out Visitor
**POST** `/api/visits/check-out-visitor`

Check out a visitor.

**Request Body:**
```json
{
  "visitor_id": 1
}
```

**Response (200 OK):**
```json
{
  "visit": {
    "id": 1,
    "check_in_time": "2025-01-15T09:00:00.000000Z",
    "check_out_time": "2025-01-15T10:30:00.000000Z",
    "duration_minutes": 90
  },
  "message": "Visitor checked out successfully"
}
```

---

#### 7. Emergency Checkout All
**POST** `/api/visits/emergency-checkout-all`

Emergency checkout all currently checked-in visitors.

**Response (200 OK):**
```json
{
  "message": "All visitors checked out successfully",
  "count": 8
}
```

---

#### 8. Export Today's Report
**GET** `/api/visits/export-today-report`

Export today's visit report.

**Response:**
Returns CSV/PDF file download with today's visit data.

---

#### 9. Get Visit Details
**GET** `/api/visits/{visit}`

Get detailed information about a specific visit.

**Response (200 OK):**
```json
{
  "visit": {
    "id": 1,
    "visitor": {...},
    "host": {...},
    "visit_date": "2025-01-15",
    "check_in_time": "2025-01-15T09:00:00.000000Z",
    "check_out_time": "2025-01-15T10:30:00.000000Z",
    "notes": "Conference room A",
    "badge_number": "BADGE-001"
  }
}
```

---

#### 10. Update Visit
**PATCH** `/api/visits/{visit}`

Update visit information.

**Request Body:**
```json
{
  "notes": "Updated notes",
  "visit_date": "2025-01-16"
}
```

**Response (200 OK):**
```json
{
  "visit": {
    "id": 1,
    "notes": "Updated notes",
    "updated_at": "2025-01-05T00:00:00.000000Z"
  }
}
```

---

#### 11. Delete Visit
**DELETE** `/api/visits/{visit}`

Delete a visit record.

**Response (200 OK):**
```json
{
  "message": "Visit deleted successfully"
}
```

---

#### 12. Check In Specific Visit
**PATCH** `/api/visits/{visit}/check-in`

Check in a specific scheduled visit.

**Response (200 OK):**
```json
{
  "visit": {
    "id": 1,
    "check_in_time": "2025-01-15T09:00:00.000000Z"
  }
}
```

---

#### 13. Check Out Specific Visit
**PATCH** `/api/visits/{visit}/check-out`

Check out a specific visit.

**Response (200 OK):**
```json
{
  "visit": {
    "id": 1,
    "check_out_time": "2025-01-15T10:30:00.000000Z",
    "duration_minutes": 90
  }
}
```

---

### Company Management

#### 1. Create Company
**POST** `/api/companies`

Create a new company.

**Request Body:**
```json
{
  "name": "New Tech Corp",
  "address": "123 Tech Street",
  "phone": "+1234567890",
  "email": "info@newtech.com"
}
```

**Response (201 Created):**
```json
{
  "company": {
    "id": 1,
    "name": "New Tech Corp",
    "address": "123 Tech Street",
    "phone": "+1234567890",
    "email": "info@newtech.com",
    "created_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

---

#### 2. Get Company
**GET** `/api/companies/{company}`

Get company details.

**Response (200 OK):**
```json
{
  "company": {
    "id": 1,
    "name": "Tech Corp",
    "visitors_count": 25,
    "recent_visits": [...]
  }
}
```

---

#### 3. Update Company
**PUT** `/api/companies/{company}`

Update company information.

**Request Body:**
```json
{
  "name": "Updated Tech Corp",
  "address": "456 New Street"
}
```

**Response (200 OK):**
```json
{
  "company": {
    "id": 1,
    "name": "Updated Tech Corp",
    "address": "456 New Street",
    "updated_at": "2025-01-05T00:00:00.000000Z"
  }
}
```

---

#### 4. Delete Company
**DELETE** `/api/companies/{company}`

Delete a company.

**Response (200 OK):**
```json
{
  "message": "Company deleted successfully"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "message": "Error message",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

### Default Limits
- **Authenticated requests**: 60 requests/minute
- **Public endpoints**: 30 requests/minute

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

---

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 15, max: 100)

### Response Format
```json
{
  "data": [...],
  "current_page": 1,
  "per_page": 15,
  "total": 150,
  "last_page": 10,
  "from": 1,
  "to": 15
}
```

---

## Testing

### Example cURL Request
```bash
# Login
curl -X POST http://visitvault.test/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get visitors (authenticated)
curl -X GET http://visitvault.test/api/visitors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Bruno API Collection
The project includes a Bruno API collection in the `visitapis/` directory for easy testing of all endpoints.

---

© BethLog Information Systems Limited
