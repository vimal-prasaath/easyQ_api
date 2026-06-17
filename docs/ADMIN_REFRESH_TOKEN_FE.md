# Staff Auth — Refresh Token (Admin, Doctor, Nurse)

**What changed:** Login now also returns a `refreshToken`. Use it to get a new access token without logging in again.

**Backward compatible:** Existing fields unchanged — only `refreshToken` is added.

---

## Endpoints

| Role | Login | Refresh | Logout |
|------|-------|---------|--------|
| Admin | `POST /api/admin/login` | `POST /api/admin/refresh` | `POST /api/admin/logout` |
| Doctor | `POST /api/doctor/login` | `POST /api/doctor/refresh` | `POST /api/doctor/logout` |
| Nurse | `POST /api/nurse/login` | `POST /api/nurse/refresh` | `POST /api/nurse/logout` |
| Doctor/Nurse (combined) | `POST /api/auth/login` | `POST /api/auth/refresh` | `POST /api/auth/logout` |

---

## Login response (updated)

All login endpoints now return:

```json
{
  "data": {
    "token": "access_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

Plus existing fields (`admin`, `doctor`, `nurse`, `user`, etc.) — unchanged.

**Store both** after login.

| Token | Lifetime | Usage |
|-------|----------|-------|
| `token` | Admin: 1 hour / Doctor & Nurse: 24 hours | `Authorization: Bearer <token>` |
| `refreshToken` | 7 days | Body of refresh endpoint only |

---

## Refresh

```http
POST /api/{admin|doctor|nurse|auth}/refresh
Content-Type: application/json

{ "refreshToken": "<stored_refresh_token>" }
```

**Response:**

```json
{
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

Replace **both** stored tokens. On **401** → refresh once → retry. If refresh fails → clear tokens → login again.

Use the refresh endpoint that matches how the user logged in (e.g. doctor login → `/api/doctor/refresh`).

---

## Logout

```http
POST /api/{admin|doctor|nurse|auth}/logout
Authorization: Bearer <access_token>
```

Then clear both tokens from client storage.

---

## Rules

- `token` → Authorization header
- `refreshToken` → refresh API body only (never in Authorization header)

---

## Frontend checklist

1. Save `data.token` + `data.refreshToken` on login
2. Use `token` on protected API calls
3. On 401 → call matching `/refresh` endpoint → update both tokens → retry
4. On logout → call matching `/logout` → clear both tokens
