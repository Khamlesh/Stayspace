# STAYSPACE BACKEND — COMPLETE DEBUGGING REPORT

**Date:** July 14, 2026
**Inspector:** Automated Backend Audit
**Scope:** Every backend file in the Stayspace project
**Status:** READ-ONLY — No code was modified

---

## TABLE OF CONTENTS

1. [Project Structure](#1-project-structure)
2. [Flask Application](#2-flask-application)
3. [Authentication](#3-authentication)
4. [Database](#4-database)
5. [Core Executable](#5-core-executable)
6. [Deployment](#6-deployment)
7. [API Endpoints Audit](#7-api-endpoints-audit)
8. [Silent Exceptions](#8-silent-exceptions)
9. [Error Handling](#9-error-handling)
10. [Environment Variables](#10-environment-variables)
11. [File Paths & Windows Dependencies](#11-file-paths--windows-dependencies)
12. [Authentication Flow Diagrams](#12-authentication-flow-diagrams)
13. [Problematic Code Patterns](#13-problematic-code-patterns)
14. [Section A — Critical Issues](#section-a--critical-issues-application-cannot-work)
15. [Section B — High Risk Issues](#section-b--high-risk-issues)
16. [Section C — Medium Issues](#section-c--medium-issues)
17. [Section D — Low Issues](#section-d--low-issues)
18. [Section E — Deployment Issues](#section-e--deployment-issues)
19. [Section F — Security Issues](#section-f--security-issues)
20. [Section G — Code Quality Issues](#section-g--code-quality-issues)
21. [Section H — Performance Issues](#section-h--performance-issues)
22. [Section I — Recommendations](#section-i--recommendations)
23. [Section J — Root Causes of HTTP 500 Errors](#section-j--exact-root-causes-of-http-500-errors)

---

## 1. PROJECT STRUCTURE

### File Listing

| File | Purpose |
|------|---------|
| `Backend/app.py` | Main Flask application (3598 lines). Contains all routes, guards, helpers, and configuration. |
| `Backend/Procfile` | Render deployment configuration: `gunicorn app:app` |
| `Backend/requirements.txt` | Python dependencies: Flask, Flask-CORS, mysql-connector-python, gunicorn |
| `Backend/runtime.txt` | Python version: `python-3.12.10` |
| `Backend/_fix.py` | One-off DB migration script (adds `nearby_location` column) |
| `Backend/seed_data.py` | Seed script for hosts, properties, amenities, and reviews |
| `Backend/seed_bookings.py` | Seed script for bookings and payments |
| `Backend/.gitignore` | Ignores `.env`, `__pycache__`, `.exe`, etc. |
| `stayspace_core.exe` | Windows-only C++ compiled binary (project root) |
| `Database/schema.sql` | Full database schema (15 tables) |
| `Database/optimize_indexes.sql` | Index optimization script |
| `CPP/` | C++ source code directory |
| `seed_demo_users.py` | Root-level demo user seeding script |
| `test_backend.py` | Pytest tests for health endpoint and auth flow |
| `test_auth.py` | Standalone auth test using subprocess |
| `.env` | Local database credentials (DB_HOST=localhost, etc.) |

### File Dependency Graph

```
app.py
 |-- imports: flask, flask_cors, mysql.connector, subprocess, hashlib, secrets, json, os, pathlib
 |-- reads: stayspace_core.exe (via subprocess)
 |-- reads: DB_CONFIG -> env vars MYSQLHOST/DB_HOST etc.
 |-- spawns: stayspace_core.exe -> db_init, auth/register, auth/login, 
 |           auth/logout, auth/validate, auth/change_password,
 |           property/create, property/host
 |
seed_data.py
 |-- imports: mysql.connector, json, subprocess, pathlib
 |-- reads: stayspace_core.exe
 |-- reads: hardcoded DB_CONFIG (localhost)
 |
seed_bookings.py
 |-- imports: mysql.connector
 |-- reads: hardcoded DB_CONFIG (localhost)
 |
seed_demo_users.py (root)
 |-- imports: mysql.connector, hashlib, secrets
 |-- reads: hardcoded DB_CONFIG (localhost)
 |
_fix.py
 |-- imports: mysql.connector
 |-- reads: hardcoded DB_CONFIG (localhost)
 |
test_backend.py
 |-- imports: Backend.app (DB_CONFIG, create_app)
 |-- depends on stayspace_core.exe for register/login tests
```

---

## 2. FLASK APPLICATION

### Application Factory — `create_app()` at `app.py:240`

- Creates Flask instance
- Configures CORS with hardcoded localhost origins plus environment-based origins
- Calls `subprocess.run()` on `stayspace_core.exe` for `db_init init` at startup (line 262)
- Calls `seed_demo_users()` at startup (line 270)
- Returns the Flask `app` object

### Global App Instance — `app.py:3594`

```python
app = create_app()
```

Gunicorn references this as `app:app` in the Procfile.

### CORS Configuration — `app.py:243-256`

```python
cors_origins = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5000", "http://127.0.0.1:5000",
]
# + FRONTEND_URL env var
# + CORS_ORIGINS env var (comma-separated)
```

**Issues:**
- Hardcoded localhost origins will never match production frontend URL unless `FRONTEND_URL` is set
- No wildcard or pattern matching for subdomains

### Middleware

- **None.** No request logging middleware, no rate limiting, no authentication middleware.
- Authentication is performed per-route via `_admin_guard()`, `_host_guard()`, `_guest_guard()`.

### Request Handling

- All routes use `request.get_json(silent=True) or {}` to parse request bodies
- GET routes use `request.args` for query parameters
- Token extraction: `body.get('token', '') or request.headers.get('X-Auth-Token', '')`

### Error Handling

- No Flask `@app.errorhandler` decorators are registered
- All error handling is done at the route level via `try/except`
- No global exception handler

---

## 3. AUTHENTICATION

### Register — `app.py:312-382`

- Extracts `gender`, `phone`, `city` from body
- For Host registrations with phone: checks for duplicate phone via direct SQL
- Delegates to `_invoke_core("auth", "register", body)` — **requires stayspace_core.exe**
- After successful Host registration: updates Hosts table with gender/phone/city via direct SQL
- Returns 500 on any exception

### Login — `app.py:406-409`

- Passes entire body to `_invoke_core("auth", "login", body)` — **requires stayspace_core.exe**
- No input validation whatsoever

### Logout — `app.py:411-414`

- Passes body to `_invoke_core("auth", "logout", body)` — **requires stayspace_core.exe**

### Validate Token — `app.py:416-419`

- Passes body to `_invoke_core("auth", "validate", body)` — **requires stayspace_core.exe**

### Change Password — `app.py:421-424`

- Passes body to `_invoke_core("auth", "change_password", body)` — **requires stayspace_core.exe**

### Forgot Password — `app.py:453-500`

- **Pure SQL implementation** — does NOT use `_invoke_core()`
- Validates email and new password presence
- Validates password length >= 8
- Looks up user by email, generates salt, hashes password with SHA-256, updates DB
- **CRITICAL:** Uses Python's `hash_password()` (SHA-256) which may differ from C++ core's hashing algorithm
- If algorithms differ, the user can never log in again after password reset

### Password Hashing Functions — `app.py:27-34`

```python
def generate_salt(length=32):
    return secrets.token_hex(length // 2)

def hash_password(password, salt):
    combined = password + salt
    return hashlib.sha256(combined.encode()).hexdigest()
```

**Issue:** SHA-256 without key stretching (like bcrypt/scrypt/argon2) is weak for password hashing.

### Admin Guard — `app.py:125-158`

- `_require_admin(token)` opens a new DB connection
- Queries Sessions + Users where role = 'Admin' and token is valid
- `_admin_guard(body)` wraps this with error handling
- Returns `(admin_dict, None)` on success or `(None, (json_response, status_code))` on failure

### Host Guard — `app.py:161-202`

- Same pattern as admin guard but joins Hosts table
- Also checks `is_approved` status
- Returns 403 with `pending_approval: True` if host is not approved

### Guest Guard — `app.py:205-237`

- Same pattern but joins Guests table

### Session Creation

- Session creation is handled by `stayspace_core.exe` (login/register)
- Flask app never directly creates sessions
- **If the C++ binary is unavailable, no sessions can be created**

### Session Validation

- `_require_admin()`, `_require_host()`, `_require_guest()` validate sessions via SQL
- Query: `SELECT ... FROM Sessions s JOIN Users u ON s.user_id = u.id WHERE s.session_token = %s AND s.expires_at > NOW()`

---

## 4. DATABASE

### DB_CONFIG — `app.py:19-25`

```python
DB_CONFIG = {
    'host': os.environ.get('MYSQLHOST', os.environ.get('DB_HOST', 'localhost')),
    'port': int(os.environ.get('MYSQLPORT', os.environ.get('DB_PORT', 3306))),
    'user': os.environ.get('MYSQLUSER', os.environ.get('DB_USER', 'root')),
    'password': os.environ.get('MYSQLPASSWORD', os.environ.get('DB_PASSWORD', 'Khamlesh@1234')),
    'database': os.environ.get('MYSQLDATABASE', os.environ.get('DB_NAME', 'stayspace'))
}
```

**Issues:**
1. **Hardcoded password `'Khamlesh@1234'` as fallback** — leaked credential in source code
2. Fallback chain: `MYSQL*` env vars -> `DB_*` env vars -> hardcoded defaults

### MySQL Connection Pattern

Every route follows this pattern (repeated ~60 times):

```python
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor(dictionary=True)
# ... queries ...
cursor.close()
conn.close()
```

**Issues:**
1. **No connection pooling** — every request creates a new TCP connection to MySQL
2. **No context managers (try/finally)** — if an exception occurs between connect and close, the connection leaks
3. **No `autocommit=False` setting** — relying on default behavior
4. **No `conn.rollback()` anywhere** in the entire codebase

### Railway/Render Environment Variables

MySQL addon provides: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

These match the env var names used in `app.py:19-24`. The host/user/password/database are all covered.

### Queries

The application uses raw SQL queries with parameterized placeholders (`%s`). No ORM is used. All queries use `mysql.connector` parameter substitution, which prevents SQL injection for value parameters.

### Transactions

**There are no explicit transaction boundaries.** The code relies on `conn.commit()` after write operations. If an exception occurs between the first write and the commit, the connection is closed without committing — but also without rolling back. On the next request, a new connection is opened, and MySQL's default behavior will auto-rollback the uncommitted transaction on the old connection when it's garbage collected.

**Critical multi-query transactions without rollback protection:**
- `create_booking()` at `app.py:1792-1883`: INSERT Bookings + INSERT Payments + UPDATE Bookings + INSERT Notifications (x3) + SELECT — if any mid-query fails, partial data remains
- `admin_host_reject()` at `app.py:2150-2180`: DELETE Hosts + UPDATE Users + INSERT Guests + INSERT Notifications
- `host_booking_action()` at `app.py:1977-2036`: UPDATE Bookings + SELECT Guests + INSERT Notifications

### Commits

Commits are present in all write routes. Pattern:

```python
conn.commit()
cursor.close()
conn.close()
return jsonify({"status": "success", ...}), 200
```

### Rollbacks

**Zero `conn.rollback()` calls in the entire 3598-line file.**

### Cursor/Connection Closing

Done manually in every route. Pattern:

```python
cursor.close()
conn.close()
```

**Issue:** Any unhandled exception between `conn = ...` and `conn.close()` will leak the connection.

---

## 5. CORE EXECUTIVE (`stayspace_core.exe`)

### `_invoke_core()` — `app.py:92-122`

```python
def _invoke_core(module: str, action: str, params: dict | None = None) -> tuple[object, int]:
    if not CORE_EXE.exists():
        return jsonify({"status": "error", "message": "Core executable not found.", "path": str(CORE_EXE)}), 500
    params = params or {}
    command = [str(CORE_EXE), module, action, json.dumps(params)]
    process = subprocess.run(
        command, cwd=str(ROOT_DIR), capture_output=True,
        text=True, encoding="utf-8", check=False,
    )
    if process.returncode != 0:
        return jsonify({"status": "error", "message": "Core engine execution failed.", "details": process.stderr.strip()}), 500
    try:
        payload = json.loads(process.stdout.strip() or "{}")
    except json.JSONDecodeError:
        return jsonify({"status": "error", "message": "Invalid JSON from core engine.", "details": process.stdout.strip()}), 500
    return jsonify(payload), 200
```

### All `_invoke_core()` Call Sites

| Line | Route | Module/Action | Purpose |
|------|-------|---------------|---------|
| 310 | `POST /api/db/init` | `db_init/init` | Initialize database schema |
| 341 | `POST /api/auth/register` | `auth/register` | Register a new user |
| 409 | `POST /api/auth/login` | `auth/login` | Authenticate user |
| 414 | `POST /api/auth/logout` | `auth/logout` | End session |
| 419 | `POST /api/auth/validate` | `auth/validate` | Validate session token |
| 424 | `POST /api/auth/change_password` | `auth/change_password` | Change user password |
| 505 | `POST /api/properties` | `property/create` | Create new property |
| 674 | `GET /api/properties/host` | `property/host` | List host's properties |

### Additional `subprocess.run()` Calls (Not via `_invoke_core`)

| Line | Location | Command | Purpose |
|------|----------|---------|---------|
| 262 | `create_app()` startup | `[CORE_EXE, "db_init", "init", ...]` | Schema init at startup |
| 65 | `seed_demo_users()` | `[CORE_EXE, "auth", "register", ...]` | Seed demo users |

### `CORE_EXE` Path Resolution — `app.py:16-17`

```python
ROOT_DIR = Path(__file__).resolve().parent.parent
CORE_EXE = ROOT_DIR / "stayspace_core.exe"
```

- `__file__` = `Backend/app.py`
- `ROOT_DIR` = project root (parent of `Backend/`)
- `CORE_EXE` = `<project_root>/stayspace_core.exe`

### Failure Analysis

| Failure Mode | Detection | HTTP Response |
|-------------|-----------|---------------|
| `.exe` file does not exist | `CORE_EXE.exists()` check at line 93 | 500 "Core executable not found" |
| `.exe` returns non-zero exit code | `process.returncode != 0` at line 107 | 500 "Core engine execution failed" |
| `.exe` returns non-JSON stdout | `json.JSONDecodeError` at line 119 | 500 "Invalid JSON from core engine" |
| `.exe` hangs/blocks forever | **No timeout set** | Worker blocks indefinitely |
| `.exe` stdout is empty | `process.stdout.strip() or "{}"` at line 118 | Returns `{"status": ...}` with empty payload |

### Linux Compatibility

**FATAL: `stayspace_core.exe` is a Windows PE executable. It cannot run on Linux.**

- The `.exe` extension itself is not the problem (Linux can run files with any extension)
- The actual problem is the binary format: Windows PE32/PE32+ cannot be executed by the Linux kernel
- `subprocess.run()` will raise `FileNotFoundError` or `OSError` on Render

---

## 6. DEPLOYMENT

### Procfile — `Backend/Procfile`

```
web: gunicorn app:app
```

- References `app:app` which means `app` object in `app.py` module
- Gunicorn will look for `app.py` in the current working directory

### runtime.txt — `Backend/runtime.txt`

```
python-3.12.10
```

- Python 3.12 is supported on Render
- Version pinning is correct

### requirements.txt — `Backend/requirements.txt`

```
Flask>=3.1,<3.2
Flask-CORS>=4.0.0
mysql-connector-python>=8.0.0
gunicorn>=21.2.0
```

- All packages are pure Python and Linux-compatible
- Version ranges are reasonable
- Missing: no pinned versions for reproducibility

### Render Compatibility Matrix

| Component | Compatible? | Notes |
|-----------|------------|-------|
| Python 3.12 | YES | Supported on Render |
| gunicorn | YES | Linux-native |
| Flask | YES | Pure Python |
| Flask-CORS | YES | Pure Python |
| mysql-connector-python | YES | Pure Python |
| stayspace_core.exe | **NO** | Windows binary, cannot run on Linux |
| MySQL connection | REQUIRES CONFIG | Must set MYSQL* env vars |
| Database schema | **FAILS** | Requires .exe for db_init |
| Demo users | **FAILS** | Requires .exe for registration |

### Environment Variables Required for Render

| Variable | Source | Notes |
|----------|--------|-------|
| `MYSQLHOST` | Render MySQL addon | Provided automatically |
| `MYSQLPORT` | Render MySQL addon | Provided automatically (default: 3306) |
| `MYSQLUSER` | Render MySQL addon | Provided automatically |
| `MYSQLPASSWORD` | Render MySQL addon | Provided automatically |
| `MYSQLDATABASE` | Render MySQL addon | Provided automatically |
| `FRONTEND_URL` | Manual | Must set to frontend URL for CORS |
| `CORS_ORIGINS` | Manual | Optional, comma-separated additional origins |

### Working Directory

- Render runs the Procfile from the directory containing it (`Backend/`)
- Gunicorn starts in `Backend/`
- `ROOT_DIR` resolves to the parent of `Backend/` (the repo root)
- `stayspace_core.exe` is expected at the repo root — it will not exist on Render

---

## 7. API ENDPOINTS AUDIT

### Complete Endpoint Table

#### System Endpoints

| Route | Method | Auth | DB Access | `_invoke_core` | Risk |
|-------|--------|------|-----------|----------------|------|
| `GET /` | GET | None | None | No | Low |
| `GET /health` | GET | None | None | No | Low |
| `POST /api/db/init` | POST | None | Indirect | **YES** | **CRITICAL** |

#### Auth Endpoints

| Route | Method | Auth | DB Access | `_invoke_core` | Risk |
|-------|--------|------|-----------|----------------|------|
| `POST /api/auth/register` | POST | None | Direct + Core | **YES** | **CRITICAL** |
| `POST /api/auth/login` | POST | None | Core only | **YES** | **CRITICAL** |
| `POST /api/auth/logout` | POST | None | Core only | **YES** | **CRITICAL** |
| `POST /api/auth/validate` | POST | None | Core only | **YES** | **CRITICAL** |
| `POST /api/auth/change_password` | POST | None | Core only | **YES** | **CRITICAL** |
| `POST /api/auth/check_email` | POST | None | Direct SQL | No | Medium |
| `POST /api/auth/check_phone` | POST | None | Direct SQL | No | Medium |
| `POST /api/auth/forgot_password` | POST | None | Direct SQL | No | **HIGH** |
| `POST /api/auth/host-status` | POST | Token | Direct SQL | No | Medium |
| `POST /api/auth/host-registered` | POST | Token | Direct SQL | No | Medium |

**Missing validation on auth endpoints:**
- `/api/auth/login`: No validation of email format, no validation of password presence
- `/api/auth/register`: All validation delegated to C++ core (unverifiable)
- `/api/auth/forgot_password`: No email verification token — anyone can reset any user's password

#### Property Endpoints

| Route | Method | Auth | DB Access | `_invoke_core` | Risk |
|-------|--------|------|-----------|----------------|------|
| `POST /api/properties` | POST | None | Core only | **YES** | **CRITICAL** |
| `GET /api/properties` | GET | None | Direct SQL | No | Medium |
| `GET /api/properties/<id>` | GET | Optional | Direct SQL | No | Medium |
| `GET /api/properties/host` | GET | Token | Core only | **YES** | **CRITICAL** |
| `GET /api/properties/<id>/availability` | GET | None | Direct SQL | No | Medium |

**Missing validation on property endpoints:**
- `GET /api/properties`: `float(request.args.get('min_price', 0))` — raises `ValueError` on non-numeric input
- `POST /api/properties`: No authentication, no host verification

#### Host Endpoints

| Route | Method | Auth | DB Access | `_invoke_core` | Risk |
|-------|--------|------|-----------|----------------|------|
| `POST /api/host/stats` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/properties` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/bookings` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/checkins` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/reviews` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/earnings-chart` | POST | Host guard | Direct SQL | No | Medium |
| `GET /api/host/profile` | GET | Host guard | Direct SQL | No | Medium |
| `POST /api/host/profile` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/change_password` | POST | Host guard | Direct SQL | No | Medium |
| `GET /api/host/notifications` | GET | Host guard | Direct SQL | No | Low |
| `POST /api/host/notifications/read` | POST | Host guard | Direct SQL | No | Low |
| `POST /api/host/notifications/delete` | POST | Host guard | Direct SQL | No | Low |
| `POST /api/host/earnings` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/property/create` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/property/update` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/property/delete` | POST | Host guard | Direct SQL | No | Medium |
| `GET /api/host/property/<id>` | GET | Host guard | Direct SQL | No | Medium |
| `POST /api/host/reports` | POST | Host guard | Direct SQL | No | Medium |
| `POST /api/host/complaints` | POST | Host guard | Direct SQL | No | Low |
| `POST /api/host/complaint/create` | POST | Host guard | Direct SQL | No | Low |
| `POST /api/host/booking/action` | POST | Host guard | Direct SQL | No | Medium |

#### Admin Endpoints

| Route | Method | Auth | DB Access | `_invoke_core` | Risk |
|-------|--------|------|-----------|----------------|------|
| `POST /api/admin/stats` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/stats_v1` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/guests` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/hosts` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/properties` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/bookings` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/users` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/user/delete` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/property/delete` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/payments` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/reviews` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/review/delete` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/complaints` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/complaint/update` | POST | Admin guard | Direct SQL | No | Medium |
| `GET /api/admin/notifications` | GET | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/notifications/read` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/notifications/delete` | POST | Admin guard | Direct SQL | No | Low |
| `GET /api/admin/profile` | GET | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/profile` | POST | Admin guard | Direct SQL | No | Low |
| `POST /api/admin/change_password` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/analytics` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/reports` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/booking/action` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/host/approve` | POST | Admin guard | Direct SQL | No | Medium |
| `POST /api/admin/host/reject` | POST | Admin guard | Direct SQL | No | Medium |

#### Guest Endpoints

| Route | Method | Auth | DB Access | `_invoke_core` | Risk |
|-------|--------|------|-----------|----------------|------|
| `POST /api/bookings/create` | POST | Guest guard | Direct SQL | No | Medium |
| `POST /api/guest/bookings` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/bookings/cancel` | POST | Guest guard | Direct SQL | No | Medium |
| `GET /api/guest/profile` | GET | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/profile` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/change_password` | POST | Guest guard | Direct SQL | No | Medium |
| `POST /api/guest/stats` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/wishlist` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/wishlist/add` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/wishlist/remove` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/wishlist/check` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/reviews` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/reviews/create` | POST | Guest guard | Direct SQL | No | Medium |
| `POST /api/guest/reviews/delete` | POST | Guest guard | Direct SQL | No | Low |
| `GET /api/guest/notifications` | GET | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/notifications/read` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/notifications/delete` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/payments` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/complaints` | POST | Guest guard | Direct SQL | No | Low |
| `POST /api/guest/complaint/create` | POST | Guest guard | Direct SQL | No | Low |

### Endpoints That Will 500 on Render

| Route | Reason |
|-------|--------|
| `POST /api/db/init` | `_invoke_core` → .exe not found |
| `POST /api/auth/register` | `_invoke_core` → .exe not found |
| `POST /api/auth/login` | `_invoke_core` → .exe not found |
| `POST /api/auth/logout` | `_invoke_core` → .exe not found |
| `POST /api/auth/validate` | `_invoke_core` → .exe not found |
| `POST /api/auth/change_password` | `_invoke_core` → .exe not found |
| `POST /api/properties` | `_invoke_core` → .exe not found |
| `GET /api/properties/host` | `_invoke_core` → .exe not found |
| **ALL other routes** | If tables don't exist (db_init failed), all SQL queries fail |

---

## 8. SILENT EXCEPTIONS

### Every Occurrence of `except: pass` or `except Exception: pass`

| File | Line | Code Context | What It Hides | Severity |
|------|------|-------------|---------------|----------|
| `app.py` | 86-87 | `seed_demo_users()` — Host update | Host approval update failure | Low |
| `app.py` | 268-269 | `create_app()` — db_init subprocess | **Database schema initialization failure** | **CRITICAL** |
| `app.py` | 644-645 | `property_details()` — booking lookup | User booking verification failure | Medium |
| `app.py` | 2237-2238 | `host_complaint_create()` — admin notification | Admin notification insert failure | Low |
| `app.py` | 3574-3575 | `guest_complaint_create()` — admin notification + **commit** | **Admin notification failure AND complaint commit skipped** | **HIGH** |

### Analysis of Each Silent Exception

**Line 86-87 (`seed_demo_users`):**
```python
except Exception:
    pass
```
Hides: Failure to update the demo host's approval status. Low impact since this is a seed function.

**Line 268-269 (startup db_init):**
```python
except Exception:
    pass
```
Hides: The entire database schema initialization process failing. This means on Render, if the .exe is missing or fails, the application starts but no tables exist. **Every subsequent request that touches the database will fail with a 500 error.** The most dangerous silent exception in the codebase.

**Line 644-645 (property details):**
```python
except Exception:
    pass
```
Hides: Failure to check whether the current user has booked this property. The `user_has_booked` flag defaults to `False`, so the host contact info is never shown even if the user has booked.

**Lines 2237-2238 and 3574-3575 (complaint notifications):**
```python
except Exception:
    pass
```
Hides: Failure to notify admins about new complaints. In the guest complaint case (line 3574), the `conn.commit()` is inside the nested try, so **if the notification fails, the complaint is never committed to the database.** The route returns 201 success, but the data is lost.

---

## 9. ERROR HANDLING

### Pattern Analysis

The codebase uses two error handling patterns:

**Pattern 1 — Route-level with error message (most common, ~60 routes):**
```python
try:
    # ... DB operations ...
    return jsonify({"status": "success", ...}), 200
except Exception as e:
    return jsonify({"status": "error", "message": str(e)}), 500
```
- Exposes raw exception text to the client (security risk: may leak DB schema, table names, column names)

**Pattern 2 — Silent swallow (5 occurrences):**
```python
except Exception:
    pass
```
- Hides the error completely, no logging, no response

### Missing Error Handling

1. **No Flask `@app.errorhandler(500)`** — unhandled exceptions outside route try/ blocks return Flask's default HTML error page
2. **No `@app.errorhandler(404)`** — unknown routes return Flask's default 404 page
3. **No `@app.errorhandler(405)`** — method not allowed returns default page
4. **No `before_request` / `after_request` error logging**
5. **No exception logging to file or external service** — all errors go to stdout via `print()` or are silently swallowed

---

## 10. ENVIRONMENT VARIABLES

| Variable | Used in Code | Required | Fallback | Assessment |
|----------|-------------|----------|----------|------------|
| `MYSQLHOST` | `app.py:20` | Yes | `DB_HOST` -> `'localhost'` | Hardcoded localhost fallback |
| `MYSQLPORT` | `app.py:21` | No | `DB_PORT` -> `3306` | OK, standard default |
| `MYSQLUSER` | `app.py:22` | Yes | `DB_USER` -> `'root'` | Hardcoded root fallback |
| `MYSQLPASSWORD` | `app.py:23` | Yes | `DB_PASSWORD` -> `'Khamlesh@1234'` | **LEAKED CREDENTIAL** |
| `MYSQLDATABASE` | `app.py:24` | Yes | `DB_NAME` -> `'stayspace'` | OK |
| `FRONTEND_URL` | `app.py:247` | Yes (for CORS) | None | If missing, only localhost CORS works |
| `CORS_ORIGINS` | `app.py:249` | No | None | OK |

### Analysis

- `MYSQL*` variables are provided automatically by Render's MySQL addon
- `FRONTEND_URL` must be manually set to the deployed frontend URL
- `CORS_ORIGINS` is optional but useful for multiple frontend domains
- The fallback to `DB_*` variables allows compatibility with other platforms
- The final fallback to hardcoded values is **a security vulnerability** in production

---

## 11. FILE PATHS & WINDOWS DEPENDENCIES

### Path References

| Variable/Expression | Location | Resolves To | Linux Compatible? |
|---------------------|----------|-------------|-------------------|
| `ROOT_DIR = Path(__file__).resolve().parent.parent` | `app.py:16` | Project root | YES |
| `CORE_EXE = ROOT_DIR / "stayspace_core.exe"` | `app.py:17` | `<root>/stayspace_core.exe` | **NO** |
| `cwd=str(ROOT_DIR)` | `app.py:100` | Project root | YES |
| `CORE_EXE.exists()` | `app.py:38, 93, 260` | Checks for .exe | Returns False on Linux |
| `str(CORE_EXE)` | Multiple | Path to .exe | Non-existent path |

### Windows-Only Dependencies

| File | Line | Code | Issue |
|------|------|------|-------|
| `app.py` | 17 | `CORE_EXE = ROOT_DIR / "stayspace_core.exe"` | Windows binary path |
| `app.py` | 65-69 | `subprocess.run([str(CORE_EXE), "auth", "register", ...])` | Executes Windows binary |
| `app.py` | 97-105 | `subprocess.run(command, cwd=str(ROOT_DIR), ...)` | Executes Windows binary |
| `app.py` | 262-267 | `subprocess.run([str(CORE_EXE), "db_init", "init", ...])` | Executes Windows binary |
| `seed_data.py` | 8 | `CORE_EXE = ROOT_DIR / "stayspace_core.exe"` | Windows binary path |
| `test_auth.py` | 6 | `cmd = ["stayspace_core.exe", ...]` | Windows binary name |

### Script-Only Hardcoded Paths (Not in Production Code)

| File | Line | Code |
|------|------|------|
| `_fix.py` | 3 | `conn = mysql.connector.connect(host='localhost', ...)` |
| `seed_data.py` | 10-15 | `DB_CONFIG = {'host': 'localhost', ...}` |
| `seed_bookings.py` | 5-10 | `DB_CONFIG = {'host': 'localhost', ...}` |
| `seed_demo_users.py` | 6-11 | `DB_CONFIG = {'host': 'localhost', ...}` |

---

## 12. AUTHENTICATION FLOW DIAGRAMS

### Login Flow

```
Frontend
  |
  | POST /api/auth/login  {email: "user@example.com", password: "pass"}
  v
Flask Route (app.py:406)
  |
  | body = request.get_json(silent=True) or {}
  v
_invoke_core("auth", "login", body)  (app.py:409)
  |
  | CORE_EXE.exists()?  ---- NO ----> 500 "Core executable not found"
  |      |
  |     YES
  |      |
  v      v
subprocess.run([stayspace_core.exe, "auth", "login", '{"email":...}'])
  |
  | returncode != 0?  ---- YES ----> 500 "Core engine execution failed"
  |      |
  |     0
  |      |
  v      v
json.loads(process.stdout)
  |
  | JSONDecodeError?  ---- YES ----> 500 "Invalid JSON from core engine"
  |      |
  |     OK
  |      |
  v      v
Return jsonify(payload), 200
```

### Authenticated Host Request Flow

```
Frontend
  |
  | POST /api/host/stats  {token: "abc123"}
  v
Flask Route (app.py:676)
  |
  | body = request.get_json(silent=True) or {}
  v
_host_guard(body)  (app.py:679)
  |
  | token = body.get('token', '') or request.headers.get('X-Auth-Token', '')
  v
_require_host(token)  (app.py:161)
  |
  | conn = mysql.connector.connect(**DB_CONFIG)  <--- New connection
  | cursor.execute("SELECT ... FROM Sessions JOIN Users JOIN Hosts WHERE token = %s AND expires > NOW()")
  | host = cursor.fetchone()
  | cursor.close()
  | conn.close()  <--- Connection closed
  |
  | host is None?  ---- YES ----> 403 "Only authenticated hosts"
  |      |
  |     NO
  |      |
  v      v
host["is_approved"]?  ---- NO ----> 403 "Pending admin approval"
  |
  v
Execute host stats SQL queries  <--- ANOTHER new connection
  |
  v
Return jsonify({"status": "success", "data": stats}), 200
```

### Registration Flow

```
Frontend
  |
  | POST /api/auth/register  {name, email, password, role, gender, phone, city}
  v
Flask Route (app.py:312)
  |
  | Extract gender, phone, city from body
  |
  | If role == 'Host' and phone:
  |     Check for duplicate phone via direct SQL  <--- Connection 1
  |     If exists: return 400
  |
  v
_invoke_core("auth", "register", body)  (app.py:341)
  |
  | subprocess.run([stayspace_core.exe, "auth", "register", params])
  |
  | If .exe missing: 500
  | If .exe fails: 500
  | If success: parse JSON
  v
If role == 'Host' and success:
  |
  | Lookup user by email  <--- Connection 2
  | Lookup host by user_id
  | UPDATE Hosts SET gender, phone, city
  | conn.commit()
  v
Return result to frontend
```

---

## 13. PROBLEMATIC CODE PATTERNS

### Hardcoded Localhost

| File | Line | Context | Risk |
|------|------|---------|------|
| `app.py` | 244-245 | CORS origins | Low (dev only, overridden by env) |
| `.env` | 1 | `DB_HOST=localhost` | Low (not used in production) |
| `_fix.py` | 3 | Direct connection | Low (one-off script) |
| `seed_data.py` | 11 | DB_CONFIG | Low (seed script) |
| `seed_bookings.py` | 6 | DB_CONFIG | Low (seed script) |
| `seed_demo_users.py` | 7 | DB_CONFIG | Low (seed script) |

### `.exe` Usage Locations

| File | Line | Context |
|------|------|---------|
| `app.py` | 17 | `CORE_EXE = ROOT_DIR / "stayspace_core.exe"` |
| `seed_data.py` | 8 | `CORE_EXE = ROOT_DIR / "stayspace_core.exe"` |
| `test_auth.py` | 6 | `cmd = ["stayspace_core.exe", ...]` |
| `Backend/.gitignore` | 38 | `stayspace_core.exe` (gitignored!) |

### SQL Injection Risk Analysis

All SQL queries use parameterized placeholders (`%s`). The f-string interpolation at `app.py:562`:
```python
cursor.execute(f"UPDATE Properties SET {', '.join(updates)} WHERE id = %s", params)
```
The `updates` list is built from a fixed set of known field names (`['title', 'description', 'address']`), so direct SQL injection through this path is not possible. However, the pattern is fragile.

### Duplicate Routes

- `POST /api/admin/stats_v1` at line 1062
- `POST /api/admin/stats` at line 2249

Both serve admin statistics but with different implementations. The `v1` version is simpler; the main one has analytics data.

### Undefined Variable Reference Risk

- `app.py:1920-1921` in `guest_bookings()`: Uses `_dt_convert()` which is defined at line 3589. Works because Python closures capture module-level names, but the function is defined after `create_app()` — this works because the function is only called at request time, not at definition time.

---

## SECTION A — CRITICAL ISSUES (Application Cannot Work)

### A1. `stayspace_core.exe` does not exist on Linux/Render

- **Files:** `app.py:17`, `app.py:92-122`, `app.py:262`
- **Impact:** Every call to `_invoke_core()` returns HTTP 500. This blocks:
  - User registration (`POST /api/auth/register`)
  - User login (`POST /api/auth/login`)
  - User logout (`POST /api/auth/logout`)
  - Session validation (`POST /api/auth/validate`)
  - Password change (`POST /api/auth/change_password`)
  - Property creation (`POST /api/properties`)
  - Host property listing (`GET /api/properties/host`)
- **This is the primary root cause of HTTP 500 errors.**

### A2. Database tables may not exist on Render

- **File:** `app.py:260-269`
- The `db_init` call at startup depends on `stayspace_core.exe`, which doesn't exist on Linux.
- The exception is silently swallowed (`except Exception: pass`).
- If the database was freshly created (as Render MySQL addons do), no tables exist.
- **Every route that touches the database will fail with 500 errors.**

### A3. `seed_demo_users()` fails silently on Render

- **File:** `app.py:36-89`
- Tries to call `stayspace_core.exe` for registration.
- Fails silently, no demo users are created.
- Login with demo credentials (`admin@stayspace.com`, etc.) will fail.

---

## SECTION B — HIGH RISK ISSUES

### B1. No connection pooling

- **File:** All routes (~60 occurrences)
- Every route handler creates a new `mysql.connector.connect()` call.
- A single authenticated request triggers 2-3 separate DB connections (guard + main query).
- Under load, this exhausts MySQL `max_connections` (default: 151).

### B2. No connection context managers or try/finally

- **File:** All routes with DB access
- Pattern: `conn = ...; cursor = ...; # operations; cursor.close(); conn.close()`
- If any exception occurs between connect and close, the connection leaks.
- Leaked connections remain in MySQL's connection pool until they timeout (default: 8 hours).

### B3. No `conn.rollback()` anywhere

- **File:** Entire `app.py` (3598 lines)
- Zero rollback calls in the entire codebase.
- Multi-query transactions (booking creation, host rejection) can leave partial data on failure.
- Examples of vulnerable transactions:
  - `create_booking()` (line 1792): 6 SQL operations in sequence
  - `admin_host_reject()` (line 2150): 4 SQL operations (DELETE + UPDATE + INSERT + INSERT)
  - `host_booking_action()` (line 1977): 3 SQL operations

### B4. Password hashing inconsistency

- **File:** `app.py:479-480` vs C++ core
- `forgot_password_endpoint()` uses Python's `hash_password()` (SHA-256, line 31-34)
- Login is handled by the C++ core, which may use a different algorithm
- If algorithms differ, **password reset permanently locks the user out**

### B5. Hardcoded database password in source code

- **File:** `app.py:23`
- `'password': os.environ.get('MYSQLPASSWORD', os.environ.get('DB_PASSWORD', 'Khamlesh@1234'))`
- This credential is committed to version control.

### B6. No timeout on `_invoke_core()`

- **File:** `app.py:98-105`
- `subprocess.run()` has no `timeout` parameter.
- If the C++ binary hangs (e.g., waiting on a DB lock), the gunicorn worker blocks forever.
- After all workers block, the application becomes completely unresponsive.

---

## SECTION C — MEDIUM ISSUES

### C1. Startup `except Exception: pass` hides schema failure

- **File:** `app.py:268-269`
- If `db_init` fails, there is zero logging. The application starts as if nothing happened.

### C2. Complaint creation has nested try/except that swallows errors

- **File:** `app.py:2232-2238` and `app.py:3568-3575`
- In `guest_complaint_create()`, `conn.commit()` is inside the nested try block.
- If the admin notification query fails, the complaint is never committed.
- The route returns HTTP 201 "Complaint submitted" but the data is lost.

### C3. `guest_bookings()` may crash on malformed dates

- **File:** `app.py:1920-1922`
- Converts date strings via `_dt_convert()` then computes `(co - ci).days`.
- If a booking has malformed dates, this raises an unhandled `ValueError`.

### C4. Unsafe float/int conversion in query parameters

- **File:** `app.py:510-515`
- `float(request.args.get('min_price', 0))` — if user sends `min_price=abc`, raises `ValueError`
- `int(request.args.get('guests', 0))` — same issue
- No input validation before conversion

### C5. `host_booking_action()` creates a second cursor on the same connection

- **File:** `app.py:2022`
- `guest_user_cursor = conn.cursor(dictionary=True)` while the first cursor may still have results.
- Works with mysql-connector-python but is fragile and may fail with other drivers.

### C6. `list_properties()` SQL injection via f-string

- **File:** `app.py:542-543, 553-564`
- WHERE clause is built via f-string: `f"WHERE {where_sql}"`.
- While `where_sql` is constructed from parameterized fragments, the f-string pattern is fragile and error-prone.

### C7. `host_registered()` has no duplicate prevention

- **File:** `app.py:2082-2117`
- Can be called repeatedly to spam admin notifications.
- No idempotency check.

---

## SECTION D — LOW ISSUES

### D1. Debug print statements in production code

- `app.py:338-339`: `print("========== REGISTER REQUEST ==========")`
- `app.py:339`: `print("REGISTER BODY:", body)`
- `app.py:108-114`: Prints core engine failure details

### D2. `mysql` may be `None` if import fails

- `app.py:11-14`: `try: import mysql.connector except ImportError: mysql = None`
- If the import fails, all DB operations crash with `AttributeError`.

### D3. `JSON_SORT_KEYS = False` is deprecated

- `app.py:257` — deprecated in Flask 2.2+

### D4. Admin endpoints use POST for read-only operations

- All admin list endpoints use POST instead of GET.
- Violates REST conventions, prevents HTTP caching.

### D5. No type hints on route functions

- All route functions lack type annotations.

### D6. No docstrings on route functions

- All 50+ route functions lack documentation.

### D7. Imports inside loops

- `app.py:907`: `from datetime import datetime as _dtx`
- `app.py:1252`: `from datetime import datetime as _dtx2`

---

## SECTION E — DEPLOYMENT ISSUES

### E1. `stayspace_core.exe` is gitignored

- `Backend/.gitignore:38`: `stayspace_core.exe`
- Root `.gitignore:8`: `*.exe`
- **The binary cannot be deployed to Render even if it were Linux-compatible.**

### E2. No database migration mechanism

- `db_init` depends on the C++ binary.
- No Python-based migration tool (Alembic, etc.).
- No SQL migration scripts in CI/CD.

### E3. No WSGI configuration

- No `gunicorn.conf.py` file.
- Default gunicorn settings: 1 sync worker, 30s timeout.
- Single worker cannot handle concurrent requests.

### E4. Procfile working directory assumptions

- Render runs the Procfile from the directory containing it (`Backend/`).
- Gunicorn starts in `Backend/` and looks for `app.py` there.
- `ROOT_DIR` resolves to parent of `Backend/` (repo root).

### E5. No `Procfile` at repo root

- The `Procfile` is at `Backend/Procfile`, not at the repo root.
- Render expects `Procfile` at the repo root by default.
- **This means Render may not detect the Procfile at all.**

---

## SECTION F — SECURITY ISSUES

### F1. Hardcoded password in source code

- `app.py:23`, `seed_data.py:14`, `seed_bookings.py:9`, `seed_demo_users.py:10`, `_fix.py:3`

### F2. No rate limiting

- Login, register, and all endpoints have no rate limiting.
- Vulnerable to brute-force attacks.

### F3. No CSRF protection

- Token-based auth via body/header, no CSRF tokens.
- Vulnerable to cross-site request forgery.

### F4. Password reset without verification

- `app.py:453-500`: Anyone can reset any user's password by providing their email and a new password.
- No email verification token, no security questions.

### F5. Raw exception messages exposed to clients

- `except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500`
- May leak database schema, table names, column names, query structure.

### F6. SHA-256 password hashing without key stretching

- `app.py:31-34`: Simple SHA-256 without bcrypt/scrypt/argon2.
- Vulnerable to rainbow table and GPU brute-force attacks.

### F7. Session tokens not invalidated on password change

- Changing password doesn't revoke existing sessions.
- A stolen session remains valid after password change.

---

## SECTION G — CODE QUALITY ISSUES

### G1. Monolithic single file (3598 lines)

- All routes, guards, helpers, and configuration in one file.
- No separation of concerns.

### G2. No Flask Blueprints

- All 50+ routes registered directly on the app object.
- No modular organization by domain (auth, admin, host, guest).

### G3. Duplicated DB connection boilerplate

- The pattern `conn = mysql.connector.connect(**DB_CONFIG); cursor = conn.cursor(...)` is repeated ~60 times.

### G4. No dependency injection or service layer

- Business logic, data access, and HTTP handling are all mixed in route functions.

### G5. Inconsistent naming conventions

- `_dt_convert` vs `_dtx` vs `_dtx2` for datetime conversion
- `host_stats` vs `admin_stats_v1` vs `admin_stats` for similar functionality

---

## SECTION H — PERFORMANCE ISSUES

### H1. No connection pooling

- ~60 routes each create a new connection. Under load, this exhausts MySQL connections.

### H2. No caching

- Property listings, stats, and reviews are re-queried on every request.
- No HTTP cache headers.

### H3. Subprocess overhead per request

- Each `_invoke_core()` call spawns a new process, loads the executable, opens a DB connection in C++, processes, and exits.
- Typical subprocess overhead: 50-200ms per call.

### H4. `admin_stats()` runs ~20 separate SQL queries

- `app.py:2249-2445`: Could be consolidated into fewer queries with subqueries or joins.

### H5. `host_properties()` runs N+2 queries (N+1 problem)

- `app.py:799-867`: One query for properties, then 2 additional queries per property in a loop.
- With 100 properties: 201 database queries.

### H6. No pagination on most list endpoints

- Admin guests, hosts, bookings, payments, reviews all return unbounded result sets.
- With large datasets, this causes memory and response time issues.

---

## SECTION I — RECOMMENDATIONS

### Priority 1: Fix the 500 Errors (Immediate)

1. **Rewrite `_invoke_core()` auth and property logic in pure Python**
   - Replace register, login, logout, validate, change_password with Python implementations
   - This eliminates the Windows binary dependency entirely
   - Alternative: Compile the C++ code to a Linux binary and include it in deployment

2. **Add a Python-based DB migration step**
   - Execute `schema.sql` at startup using `mysql.connector` directly
   - Or use Alembic for version-controlled migrations

3. **Set the `Procfile` at the repo root**
   - Move `Backend/Procfile` to the repo root
   - Or configure Render to use the `Backend/` directory as the root

### Priority 2: Fix Data Integrity (High)

4. **Add `conn.rollback()` in all exception handlers**
5. **Implement connection pooling** (`mysql.connector.pooling.MySQLConnectionPool`)
6. **Use try/finally for all DB connections** to prevent leaks
7. **Fix the password hashing inconsistency** in `forgot_password_endpoint()`

### Priority 3: Security (High)

8. **Remove hardcoded credentials from source code**
9. **Add rate limiting** (Flask-Limiter)
10. **Implement proper password reset** with email verification tokens
11. **Upgrade password hashing** to bcrypt or argon2
12. **Sanitize error messages** — don't expose raw exceptions to clients

### Priority 4: Quality & Performance (Medium)

13. **Split into Flask Blueprints** (auth, admin, host, guest, property)
14. **Add input validation** (Flask-Marshmallow or Pydantic)
15. **Add logging** (Python `logging` module) instead of `print()`
16. **Add `gunicorn.conf.py`** with appropriate worker count and timeout
17. **Add `@app.errorhandler` decorators** for 400, 403, 404, 405, 500
18. **Add `timeout` to `subprocess.run()`** in `_invoke_core()`

### Priority 5: Deployment (Medium)

19. **Add `gunicorn.conf.py`** with workers=3, timeout=120
20. **Add health check endpoint** that verifies DB connectivity
21. **Add startup readiness check** that verifies all tables exist
22. **Set `FRONTEND_URL` and `CORS_ORIGINS` in Render environment**

---

## SECTION J — EXACT ROOT CAUSES OF HTTP 500 ERRORS

### Root Cause 1 (PRIMARY): `stayspace_core.exe` does not exist on Linux

**Location:** `app.py:93-94`

```python
if not CORE_EXE.exists():
    return jsonify({"status": "error", "message": "Core executable not found.", "path": str(CORE_EXE)}), 500
```

**Affected endpoints (8):**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/validate`
- `POST /api/auth/change_password`
- `POST /api/properties` (create)
- `GET /api/properties/host`
- `POST /api/db/init`

### Root Cause 2: Database tables do not exist

**Location:** `app.py:260-269`

```python
if CORE_EXE.exists():
    try:
        subprocess.run([str(CORE_EXE), "db_init", "init", json.dumps({})], ...)
    except Exception:
        pass  # <--- Silent failure
```

Since `.exe` doesn't exist, `db_init` never runs. If the MySQL database is fresh (as on Render), tables don't exist. Every SQL query fails with:

```
ProgrammingError: Table 'stayspace.Users' doesn't exist
```

**This affects ALL routes that touch the database (~55 routes).**

### Root Cause 3: Demo user seeding failure

**Location:** `app.py:270`

```python
seed_demo_users()  # Depends on stayspace_core.exe
```

No demo users are created. Login with demo credentials fails.

### Root Cause 4 (Conditional): `Procfile` location

**Location:** `Backend/Procfile`

Render expects `Procfile` at the repository root. If it's only in `Backend/`, Render may not detect it and the application won't start at all.

### The Fix Chain

```
Fix .exe dependency (rewrite auth in pure Python)
        |
        v
Fix schema initialization (add Python-based migration)
        |
        v
Fix Procfile location (move to repo root)
        |
        v
Set MYSQL* and FRONTEND_URL env vars in Render
        |
        v
Application works on Render
```

---

*End of Report*
