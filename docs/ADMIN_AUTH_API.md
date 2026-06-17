# Admin Authentication API — Frontend Guide

This document explains how the **hospital admin** frontend should authenticate with the API, including **access tokens**, **refresh tokens**, login, logout, and token refresh.

**Base URL:** `http://localhost:3000/api` (production URL from your env config)

**Auth header format:** `Authorization: Bearer <access_token>`

---

## Overview

| Token | Purpose | Default lifetime | Where to send |
|-------|---------|------------------|---------------|
| **Access token** (`token`) | Authenticate API requests | 1 hour | `Authorization` header on protected routes |
| **Refresh token** (`refreshToken`) | Get a new access token without re-login | 7 days | Body of `POST /api/admin/refresh` only |

**Important rules:**

1. Store **both** tokens after login or signup.
2. Send only the **access token** in the `Authorization` header.
3. Never send the refresh token as a Bearer token — the API will reject it.
4. When the access token expires, call `/api/admin/refresh` with the refresh token.
5. On logout, call `/api/admin/logout` to revoke the refresh token on the server.
6. Each successful refresh returns a **new** access token and a **new** refresh token (rotation). Always replace both in storage.

---

## Endpoints

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/admin/signup` | No | Create admin account (returns tokens) |
| `POST` | `/api/admin/login` | No | Login and receive tokens |
| `POST` | `/api/admin/refresh` | No | Exchange refresh token for new tokens |
| `POST` | `/api/admin/logout` | Yes (access token) | Revoke refresh token |

All other `/api/admin/*` routes require a valid **access token**.

---

## 1. Admin signup

Creates an admin account and returns tokens immediately.

```http
POST /api/admin/signup
Content-Type: application/json
```

**Request body:**

```json
{
  "email": "admin@hospital.com",
  "password": "securePassword123",
  "username": "hospital_admin"
}
```

**Success response (201):**

```json
{
  "success": true,
  "message": "Admin account created successfully",
  "data": {
    "message": "Admin account created successfully",
    "admin": {
      "adminId": "A0001",
      "email": "admin@hospital.com",
      "username": "hospital_admin",
      "verificationStatus": "Pending",
      "isActive": true,
      "onboardingProgress": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-06-14T10:00:00.000Z"
}
```

---

## 2. Admin login

```http
POST /api/admin/login
Content-Type: application/json
```

**Request body:**

```json
{
  "email": "admin@hospital.com",
  "password": "securePassword123"
}
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "message": "Admin authenticated successfully",
    "admin": {
      "adminId": "A0001",
      "email": "admin@hospital.com",
      "username": "hospital_admin",
      "verificationStatus": "Pending",
      "isActive": true,
      "onboardingProgress": 33.33
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-06-14T10:00:00.000Z"
}
```

**Common errors:**

| Status | Message | Frontend action |
|--------|---------|-----------------|
| 400 | Email and password are required | Show validation error |
| 401 | Invalid email / Invalid password | Show login error |
| 401 | Admin account is not active | Show account disabled message |

---

## 3. Refresh access token

Call this when the access token expires or before it expires (proactive refresh).

```http
POST /api/admin/refresh
Content-Type: application/json
```

**Request body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Admin token refreshed successfully",
  "data": {
    "message": "Token refreshed successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-06-14T11:00:00.000Z"
}
```

**Common errors:**

| Status | Message | Frontend action |
|--------|---------|-----------------|
| 400 | Refresh token is required | Fix client bug |
| 401 | Invalid or expired refresh token | Clear storage, redirect to login |
| 401 | Refresh token has been revoked. Please login again. | Clear storage, redirect to login |
| 401 | Admin account is not active | Clear storage, show disabled message |

**Note:** The old refresh token becomes invalid after a successful refresh. Always save the new `refreshToken` from the response.

---

## 4. Admin logout

Revokes the refresh token on the server. The access token may still work until it expires, but the session cannot be renewed.

```http
POST /api/admin/logout
Authorization: Bearer <access_token>
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Admin logout successful",
  "data": {
    "message": "Admin logged out successfully"
  },
  "timestamp": "2026-06-14T12:00:00.000Z"
}
```

After logout, clear both tokens from client storage and redirect to the login page.

---

## 5. Using the access token on protected routes

Example: fetch admin dashboard.

```http
POST /api/admin/dashboard
Authorization: Bearer <access_token>
Content-Type: application/json
```

If the access token is missing, invalid, or expired:

```json
{
  "success": false,
  "error": {
    "type": "AuthenticationError",
    "message": "Authentication failed: Token expired.",
    "statusCode": 401,
    "isOperational": true
  },
  "timestamp": "2026-06-14T12:00:00.000Z"
}
```

When you receive a 401 on a protected route, try refreshing the token once. If refresh fails, redirect to login.

---

## Frontend implementation guide

### What to store

Recommended `localStorage` / `sessionStorage` keys (or equivalent in your state layer):

```text
admin_access_token   → data.token
admin_refresh_token  → data.refreshToken
admin_profile        → data.admin (optional, for UI)
```

Use `sessionStorage` if you prefer sessions that end when the browser tab closes. Use `localStorage` for persistent login across tabs (still bounded by refresh token expiry).

### Auth flow

```text
┌─────────────┐
│   Login     │
└──────┬──────┘
       │ POST /api/admin/login
       ▼
┌─────────────────────────────┐
│ Save token + refreshToken   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ API call with access token  │
└──────┬──────────────────────┘
       │
       ├── 200 OK ──────────────────► continue
       │
       └── 401 Unauthorized
              │
              ▼
       ┌──────────────────────┐
       │ POST /api/admin/refresh │
       └──────┬───────────────┘
              │
              ├── success ──► update tokens, retry original request
              │
              └── failure ──► clear storage, go to login
```

### Example: save tokens after login

```javascript
async function adminLogin(email, password) {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || result.message);
  }

  localStorage.setItem('admin_access_token', result.data.token);
  localStorage.setItem('admin_refresh_token', result.data.refreshToken);
  localStorage.setItem('admin_profile', JSON.stringify(result.data.admin));

  return result.data;
}
```

### Example: refresh helper

```javascript
async function refreshAdminTokens() {
  const refreshToken = localStorage.getItem('admin_refresh_token');

  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await fetch(`${API_BASE}/admin/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const result = await response.json();

  if (!result.success) {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_profile');
    throw new Error(result.error?.message || 'Session expired');
  }

  localStorage.setItem('admin_access_token', result.data.token);
  localStorage.setItem('admin_refresh_token', result.data.refreshToken);

  return result.data.token;
}
```

### Example: Axios interceptor (single retry)

```javascript
import axios from 'axios';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAdminTokens();
      refreshQueue.forEach(({ resolve }) => resolve(newToken));
      refreshQueue = [];
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach(({ reject }) => reject(refreshError));
      refreshQueue = [];
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
```

### Example: logout

```javascript
async function adminLogout() {
  const token = localStorage.getItem('admin_access_token');

  try {
    if (token) {
      await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } finally {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_profile');
    window.location.href = '/login';
  }
}
```

---

## Curl examples (for manual testing)

### Login

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "securePassword123"
  }'
```

### Refresh

```bash
curl -X POST http://localhost:3000/api/admin/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Logout

```bash
curl -X POST http://localhost:3000/api/admin/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Protected route (example)

```bash
curl -X POST http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## Environment configuration (server-side)

These affect token lifetimes on the API server:

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `secret` | Signing key (must match across environments) |
| `JWT_ACCESS_EXPIRY_SECONDS` | `3600` | Access token lifetime in seconds (1 hour) |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifetime (e.g. `7d`, `30d`) |

The frontend does not need these values directly, but should assume access tokens expire around **1 hour** and plan refresh accordingly.

---

## Checklist for frontend team

- [ ] Save `data.token` and `data.refreshToken` after login/signup
- [ ] Attach `data.token` as `Authorization: Bearer ...` on all protected admin API calls
- [ ] On 401, call `/api/admin/refresh` once and retry the failed request
- [ ] Replace **both** tokens after every successful refresh
- [ ] On refresh failure, clear storage and redirect to login
- [ ] Call `/api/admin/logout` on explicit logout, then clear storage
- [ ] Do not send `refreshToken` in the `Authorization` header

---

## Related docs

- [Complete Curl Commands](./COMPLETE_CURL_COMMANDS.md) — all admin endpoints
- [Admin Requirements & Status](./ADMIN_REQUIREMENTS_AND_STATUS.md) — admin feature overview
- [API Endpoints Complete](./API_ENDPOINTS_COMPLETE.md) — full endpoint list
