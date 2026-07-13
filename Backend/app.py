import json
import os
import subprocess
import hashlib
import secrets
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    import mysql.connector
except ImportError:
    mysql = None

ROOT_DIR = Path(__file__).resolve().parent.parent
CORE_EXE = ROOT_DIR / "stayspace_core.exe"

DB_CONFIG = {
    'host': os.environ.get('MYSQLHOST', os.environ.get('DB_HOST', 'localhost')),
    'port': int(os.environ.get('MYSQLPORT', os.environ.get('DB_PORT', 3306))),
    'user': os.environ.get('MYSQLUSER', os.environ.get('DB_USER', 'root')),
    'password': os.environ.get('MYSQLPASSWORD', os.environ.get('DB_PASSWORD', 'Khamlesh@1234')),
    'database': os.environ.get('MYSQLDATABASE', os.environ.get('DB_NAME', 'stayspace'))
}

def generate_salt(length=32):
    """Generate random salt"""
    return secrets.token_hex(length // 2)

def hash_password(password, salt):
    """Hash password using SHA-256"""
    combined = password + salt
    return hashlib.sha256(combined.encode()).hexdigest()

def seed_demo_users():
    """Insert demo users into database via core executable for correct hashing"""
    if not CORE_EXE.exists():
        return False
    
    demo_users = [
        {'name': 'Admin User', 'email': 'admin@stayspace.com', 'password': 'Admin@123', 'role': 'Admin'},
        {'name': 'Priya Host', 'email': 'host@stayspace.com', 'password': 'Host@123', 'role': 'Host'},
        {'name': 'Aarav Guest', 'email': 'user@stayspace.com', 'password': 'User@123', 'role': 'Guest'}
    ]
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        existing_emails = set()
        cursor.execute("SELECT email FROM Users WHERE email IN (%s, %s, %s)",
                       (demo_users[0]['email'], demo_users[1]['email'], demo_users[2]['email']))
        for row in cursor.fetchall():
            existing_emails.add(row[0])
        cursor.close()
        conn.close()
    except Exception:
        existing_emails = set()

    for user in demo_users:
        if user['email'] in existing_emails:
            continue
        try:
            params = json.dumps(user)
            subprocess.run(
                [str(CORE_EXE), "auth", "register", params],
                cwd=str(ROOT_DIR),
                capture_output=True, text=True, encoding="utf-8",
                check=False, timeout=10
            )
        except Exception as e:
            print(f"Seed warning for {user['email']}: {e}")
    
    # Approve demo host after seeding
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Hosts h JOIN Users u ON h.user_id = u.id
            SET h.is_approved = TRUE, h.gender = 'Female', h.phone = '9876543210', h.city = 'Mumbai'
            WHERE u.email = 'host@stayspace.com' AND u.role = 'Host'
        """)
        conn.commit()
        cursor.close()
        conn.close()
    except Exception:
        pass
    
    return True


def _invoke_core(module: str, action: str, params: dict | None = None) -> tuple[object, int]:
    if not CORE_EXE.exists():
        return jsonify({"status": "error", "message": "Core executable not found.", "path": str(CORE_EXE)}), 500

    params = params or {}
    command = [str(CORE_EXE), module, action, json.dumps(params)]
    process = subprocess.run(
        command,
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )

    if process.returncode != 0:
        print("===== CORE ENGINE FAILED =====")
        print("Return Code:", process.returncode)
        print("STDOUT:")
        print(process.stdout)
        print("STDERR:")
        print(process.stderr)
        print("==============================")
        return jsonify({"status": "error", "message": "Core engine execution failed.", "details": process.stderr.strip()}), 500

    try:
        payload = json.loads(process.stdout.strip() or "{}")
    except json.JSONDecodeError:
        return jsonify({"status": "error", "message": "Invalid JSON from core engine.", "details": process.stdout.strip()}), 500

    return jsonify(payload), 200


def _require_admin(token: str):
    if not token:
        return None

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT u.id, u.name, u.email, u.role
        FROM Sessions s
        JOIN Users u ON s.user_id = u.id
        WHERE s.session_token = %s
          AND s.expires_at > NOW()
          AND u.role = 'Admin'
        """,
        (token,)
    )
    admin = cursor.fetchone()
    cursor.close()
    conn.close()
    return admin


def _admin_guard(body):
    token = (body or {}).get('token', '') or request.headers.get('X-Auth-Token', '')
    try:
        admin = _require_admin(token)
    except Exception as e:
        return None, (jsonify({"status": "error", "message": f"Admin validation failed: {str(e)}"}), 500)

    if not admin:
        return None, (jsonify({"status": "error", "message": "Only administrators can access this data"}), 403)

    return admin, None


def _require_host(token: str):
    if not token:
        return None

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT u.id, u.name, u.email, u.role, u.profile_picture,
               h.id AS host_id, h.is_approved, COALESCE(h.bio, '') AS bio,
               COALESCE(h.gender, '') AS gender,
               COALESCE(h.phone, '') AS phone,
               COALESCE(h.city, '') AS city
        FROM Sessions s
        JOIN Users u ON s.user_id = u.id
        JOIN Hosts h ON h.user_id = u.id
        WHERE s.session_token = %s
          AND s.expires_at > NOW()
          AND u.role = 'Host'
        """,
        (token,)
    )
    host = cursor.fetchone()
    cursor.close()
    conn.close()
    return host


def _host_guard(body):
    token = (body or {}).get('token', '') or request.headers.get('X-Auth-Token', '')
    try:
        host = _require_host(token)
    except Exception as e:
        return None, (jsonify({"status": "error", "message": f"Host validation failed: {str(e)}"}), 500)

    if not host:
        return None, (jsonify({"status": "error", "message": "Only authenticated hosts can access this data"}), 403)

    if not host.get("is_approved"):
        return None, (jsonify({"status": "error", "message": "Your host account is pending admin approval", "pending_approval": True}), 403)

    return host, None


def _require_guest(token: str):
    if not token:
        return None
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT u.id, u.name, u.email, u.role, u.profile_picture,
               g.id AS guest_id
        FROM Sessions s
        JOIN Users u ON s.user_id = u.id
        JOIN Guests g ON g.user_id = u.id
        WHERE s.session_token = %s
          AND s.expires_at > NOW()
          AND u.role = 'Guest'
        """,
        (token,)
    )
    guest = cursor.fetchone()
    cursor.close()
    conn.close()
    return guest


def _guest_guard(body):
    token = (body or {}).get('token', '') or request.headers.get('X-Auth-Token', '')
    try:
        guest = _require_guest(token)
    except Exception as e:
        return None, (jsonify({"status": "error", "message": f"Guest validation failed: {str(e)}"}), 500)
    if not guest:
        return None, (jsonify({"status": "error", "message": "Only authenticated guests can access this data"}), 403)
    return guest, None


def create_app() -> Flask:
    app = Flask(__name__)

    cors_origins = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5000", "http://127.0.0.1:5000",
    ]
    if os.environ.get("FRONTEND_URL"):
        cors_origins.append(os.environ["FRONTEND_URL"])
    if os.environ.get("CORS_ORIGINS"):
        cors_origins.extend(
            o.strip() for o in os.environ["CORS_ORIGINS"].split(",") if o.strip()
        )
    CORS(app, origins=cors_origins,
         allow_headers=["X-Auth-Token", "Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True)
    app.config["JSON_SORT_KEYS"] = False
    
    # Initialize DB schema, then seed demo users on startup
    if CORE_EXE.exists():
        try:
            subprocess.run(
                [str(CORE_EXE), "db_init", "init", json.dumps({})],
                cwd=str(ROOT_DIR),
                capture_output=True, text=True, encoding="utf-8",
                check=False, timeout=30
            )
        except Exception:
            pass
    seed_demo_users()

    @app.get("/")
    def index():
        return jsonify({
            "status": "ok",
            "service": "stayspace",
            "message": "StaySpace API is running.",
            "routes": [
                "/health",
                "/api/db/init",
                "/api/auth/register",
                "/api/auth/login",
                "/api/auth/logout",
                "/api/auth/validate",
                "/api/auth/change_password",
                "/api/auth/check_email",
                "/api/auth/forgot_password",
                "/api/admin/stats",
                "/api/admin/guests",
                "/api/admin/hosts",
                "/api/admin/properties",
                "/api/admin/bookings",
                "/api/properties",
                "/api/properties/host",
                "/api/host/stats",
                "/api/host/properties",
                "/api/host/bookings",
                "/api/host/checkins",
                "/api/host/reviews",
                "/api/host/earnings-chart"
            ]
        })

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "stayspace"})

    @app.post("/api/db/init")
    def init_db():
        return _invoke_core("db_init", "init", {})

    @app.post("/api/auth/register")
    def register():
        body = request.get_json(silent=True) or {}

        gender = body.pop('gender', '')
        phone = body.pop('phone', '')
        city = body.pop('city', '')

        if body.get('role') == 'Host' and phone:
            try:
                conn = mysql.connector.connect(**DB_CONFIG)
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    "SELECT h.id FROM Hosts h JOIN Users u ON h.user_id = u.id WHERE h.phone = %s",
                    (phone,)
                )
                existing = cursor.fetchone()
                cursor.close()
                conn.close()
                if existing:
                    return jsonify({"status": "error", "message": "This phone number is already registered"}), 400
            except Exception as e:
                import traceback
                traceback.print_exc()
                print("REGISTER EXCEPTION:", str(e))

        print("========== REGISTER REQUEST ==========")
        print("REGISTER BODY:", body)
        try:
            result = _invoke_core("auth", "register", body)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print("REGISTER ERROR:", str(e))
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500

        if body.get('role') == 'Host' and isinstance(result, tuple):
            resp_json, status_code = result
            resp_data = resp_json.get_json() if hasattr(resp_json, 'get_json') else None
            if resp_data and resp_data.get('status') == 'success':
                try:
                    conn = mysql.connector.connect(**DB_CONFIG)
                    cursor = conn.cursor(dictionary=True)
                    cursor.execute(
                        "SELECT id FROM Users WHERE email = %s",
                        (body.get('email', ''),)
                    )
                    user_row = cursor.fetchone()
                    if user_row:
                        cursor.execute(
                            "SELECT id FROM Hosts WHERE user_id = %s",
                            (user_row['id'],)
                        )
                        host_row = cursor.fetchone()
                        if host_row:
                            cursor.execute(
                                "UPDATE Hosts SET gender = %s, phone = %s, city = %s WHERE id = %s",
                                (gender, phone, city, host_row['id'])
                            )
                            conn.commit()
                    cursor.close()
                    conn.close()
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    print("REGISTER EXCEPTION:", str(e))

        return result

    @app.post("/api/auth/check_phone")
    def check_phone():
        body = request.get_json(silent=True) or {}
        phone = body.get('phone', '').strip()
        if not phone:
            return jsonify({"status": "error", "message": "Phone number is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT h.id FROM Hosts h WHERE h.phone = %s",
                (phone,)
            )
            existing = cursor.fetchone()
            cursor.close()
            conn.close()
            if existing:
                return jsonify({"status": "error", "message": "Phone number already registered"}), 409
            return jsonify({"status": "success", "message": "Phone number available"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/auth/login")
    def login():
        body = request.get_json(silent=True) or {}
        return _invoke_core("auth", "login", body)

    @app.post("/api/auth/logout")
    def logout():
        body = request.get_json(silent=True) or {}
        return _invoke_core("auth", "logout", body)

    @app.post("/api/auth/validate")
    def validate_session():
        body = request.get_json(silent=True) or {}
        return _invoke_core("auth", "validate", body)

    @app.post("/api/auth/change_password")
    def change_password():
        body = request.get_json(silent=True) or {}
        return _invoke_core("auth", "change_password", body)

    @app.post("/api/auth/check_email")
    def check_email():
        body = request.get_json(silent=True) or {}
        email = body.get('email', '').strip()

        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM Users WHERE email = %s", (email,))
            user = cursor.fetchone()
            cursor.close()
            conn.close()

            if not user:
                return jsonify({"status": "error", "message": "Email not found"}), 404

            return jsonify({"status": "success", "message": "Email found"}), 200

        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Error checking email: {str(e)}"
            }), 500

    @app.post("/api/auth/forgot_password")
    def forgot_password_endpoint():
        body = request.get_json(silent=True) or {}
        email = body.get('email', '').strip()
        new_password = body.get('new_password', '').strip()
        
        if not email or not new_password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        if len(new_password) < 8:
            return jsonify({"status": "error", "message": "Password must be at least 8 characters"}), 400
        
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT id FROM Users WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if not user:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Email not found"}), 404
            
            # Update password
            salt = generate_salt()
            password_hash = hash_password(new_password, salt)
            
            cursor.execute(
                "UPDATE Users SET password_hash = %s, salt = %s WHERE email = %s",
                (password_hash, salt, email)
            )
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({
                "status": "success",
                "message": "Password reset successfully"
            }), 200
            
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Error resetting password: {str(e)}"
            }), 500

    @app.post("/api/properties")
    def create_property():
        body = request.get_json(silent=True) or {}
        return _invoke_core("property", "create", body)

    @app.get("/api/properties")
    def list_properties():
        query_param = request.args.get('query', '')
        min_price = float(request.args.get('min_price', 0))
        max_price = float(request.args.get('max_price', 0))
        guests = int(request.args.get('guests', 0))
        property_type = request.args.get('property_type', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 24))

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            where_clauses = ["1=1"]
            params = []
            if query_param:
                where_clauses.append("(p.title LIKE %s OR p.address LIKE %s OR p.description LIKE %s OR p.nearby_location LIKE %s OR p.property_type LIKE %s)")
                like_q = f"%{query_param}%"
                params.extend([like_q, like_q, like_q, like_q, like_q])
            if min_price > 0:
                where_clauses.append("p.price_per_night >= %s")
                params.append(min_price)
            if max_price > 0 and max_price < 10000:
                where_clauses.append("p.price_per_night <= %s")
                params.append(max_price)
            if guests > 0:
                where_clauses.append("p.max_guests >= %s")
                params.append(guests)
            if property_type and property_type in ('Apartment', 'House', 'Villa'):
                where_clauses.append("p.property_type = %s")
                params.append(property_type)

            where_sql = " AND ".join(where_clauses)

            count_sql = f"""
                SELECT COUNT(DISTINCT p.id) AS total
                FROM Properties p
                LEFT JOIN Reviews r ON r.property_id = p.id
                WHERE {where_sql}
            """
            cursor.execute(count_sql, params)
            total = cursor.fetchone()['total']
            total_pages = max(1, (total + per_page - 1) // per_page)

            offset = (page - 1) * per_page
            sql = f"""
                SELECT p.id, p.title, p.description, p.image_url, p.property_type,
                       p.address, p.price_per_night, p.max_guests, p.created_at,
                       p.bedrooms, p.bathrooms, p.beds, p.property_size, p.nearby_location,
                       COALESCE(AVG(r.rating), 0) AS average_rating,
                       COUNT(DISTINCT r.id) AS review_count
                FROM Properties p
                LEFT JOIN Reviews r ON r.property_id = p.id
                WHERE {where_sql}
                GROUP BY p.id ORDER BY p.id DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(sql, params + [per_page, offset])
            properties = cursor.fetchall()
            for prop in properties:
                prop['price_per_night'] = float(prop['price_per_night'])
                prop['average_rating'] = round(float(prop['average_rating'] or 0), 1)
                prop['review_count'] = int(prop['review_count'])
                prop['created_at'] = str(prop['created_at'])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Search completed.", "data": properties, "total": total, "page": page, "per_page": per_page, "total_pages": total_pages}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.get("/api/properties/<int:property_id>")
    def property_details(property_id: int):
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT p.id, p.title, p.description, p.image_url, p.property_type,
                       p.address, p.price_per_night, p.max_guests, p.created_at,
                       p.bedrooms, p.bathrooms, p.beds, p.property_size, p.nearby_location,
                       COALESCE(AVG(r.rating), 0) AS average_rating,
                       COUNT(DISTINCT r.id) AS review_count
                FROM Properties p
                LEFT JOIN Reviews r ON r.property_id = p.id
                WHERE p.id = %s
                GROUP BY p.id
                """,
                (property_id,)
            )
            prop = cursor.fetchone()
            if not prop:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Property not found"}), 404
            prop['price_per_night'] = float(prop['price_per_night'])
            prop['average_rating'] = round(float(prop['average_rating'] or 0), 1)
            prop['review_count'] = int(prop['review_count'])
            prop['created_at'] = str(prop['created_at'])

            cursor.execute("SELECT name FROM Amenities WHERE property_id = %s", (property_id,))
            prop['amenities'] = [row['name'] for row in cursor.fetchall()]

            cursor.execute(
                """
                SELECT u.name AS guest_name, rv.rating, rv.comment, rv.created_at
                FROM Reviews rv
                JOIN Guests g ON g.id = rv.guest_id
                JOIN Users u ON u.id = g.user_id
                WHERE rv.property_id = %s
                ORDER BY rv.created_at DESC LIMIT 10
                """,
                (property_id,)
            )
            reviews = cursor.fetchall()
            for rev in reviews:
                rev['created_at'] = str(rev['created_at'])
            prop['reviews'] = reviews

            token = request.headers.get('X-Auth-Token', '')
            user_has_booked = False
            if token:
                try:
                    cursor.execute(
                        """
                        SELECT 1 FROM Bookings b
                        JOIN Guests g ON g.id = b.guest_id
                        JOIN Sessions s ON s.user_id = g.user_id
                        WHERE b.property_id = %s
                          AND b.status IN ('Confirmed', 'Checked-In', 'Completed')
                          AND s.session_token = %s
                          AND s.expires_at > NOW()
                        LIMIT 1
                        """,
                        (property_id, token)
                    )
                    user_has_booked = cursor.fetchone() is not None
                except Exception:
                    pass

            if user_has_booked:
                cursor.execute(
                    """
                    SELECT u.name, u.email, h.bio, h.phone, h.city
                    FROM Hosts h
                    JOIN Users u ON u.id = h.user_id
                    JOIN Properties p ON p.host_id = h.id
                    WHERE p.id = %s
                    """,
                    (property_id,)
                )
                prop['host'] = cursor.fetchone()
            else:
                prop['host'] = None

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": prop}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.get("/api/properties/host")
    def host_properties_get():
        token = request.args.get('token') or request.headers.get('X-Auth-Token', '')
        if not token:
            body = request.get_json(silent=True) or {}
            token = body.get('token', '')
        return _invoke_core("property", "host", {"token": token})

    @app.post("/api/host/stats")
    def host_stats():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error

        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            def scalar(query, params=()):
                cursor.execute(query, params)
                row = cursor.fetchone()
                return list(row.values())[0] if row else 0

            total_properties = scalar(
                "SELECT COUNT(*) AS count FROM Properties WHERE host_id = %s", (host_id,)
            )
            total_bookings = scalar(
                """
                SELECT COUNT(*) AS count FROM Bookings b
                JOIN Properties p ON p.id = b.property_id
                WHERE p.host_id = %s AND b.status != 'Cancelled'
                """,
                (host_id,)
            )
            monthly_earnings = float(scalar(
                """
                SELECT COALESCE(SUM(pay.amount), 0) AS total
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                JOIN Properties p ON p.id = b.property_id
                WHERE p.host_id = %s AND pay.status = 'Success'
                  AND MONTH(pay.created_at) = MONTH(CURRENT_DATE())
                  AND YEAR(pay.created_at) = YEAR(CURRENT_DATE())
                """,
                (host_id,)
            ))
            last_month_earnings = float(scalar(
                """
                SELECT COALESCE(SUM(pay.amount), 0) AS total
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                JOIN Properties p ON p.id = b.property_id
                WHERE p.host_id = %s AND pay.status = 'Success'
                  AND MONTH(pay.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                  AND YEAR(pay.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                """,
                (host_id,)
            ))
            avg_rating = float(scalar(
                """
                SELECT COALESCE(AVG(r.rating), 0) AS avg_rating
                FROM Reviews r
                JOIN Properties p ON p.id = r.property_id
                WHERE p.host_id = %s
                """,
                (host_id,)
            ))
            prev_avg_rating = float(scalar(
                """
                SELECT COALESCE(AVG(r.rating), 0) AS avg_rating
                FROM Reviews r
                JOIN Properties p ON p.id = r.property_id
                WHERE p.host_id = %s
                  AND r.created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
                """,
                (host_id,)
            ))
            properties_this_month = scalar(
                """
                SELECT COUNT(*) AS count FROM Properties
                WHERE host_id = %s
                  AND MONTH(created_at) = MONTH(CURRENT_DATE())
                  AND YEAR(created_at) = YEAR(CURRENT_DATE())
                """,
                (host_id,)
            )
            bookings_this_month = scalar(
                """
                SELECT COUNT(*) AS count FROM Bookings b
                JOIN Properties p ON p.id = b.property_id
                WHERE p.host_id = %s AND b.status != 'Cancelled'
                  AND MONTH(b.created_at) = MONTH(CURRENT_DATE())
                  AND YEAR(b.created_at) = YEAR(CURRENT_DATE())
                """,
                (host_id,)
            )
            unread_notifications = scalar(
                "SELECT COUNT(*) AS count FROM Notifications WHERE user_id = %s AND is_read = FALSE",
                (host["id"],)
            )

            earnings_growth = 0.0
            if last_month_earnings > 0:
                earnings_growth = round(((monthly_earnings - last_month_earnings) / last_month_earnings) * 100, 1)

            rating_change = round(avg_rating - prev_avg_rating, 1) if prev_avg_rating > 0 else round(avg_rating, 1)

            stats = {
                "total_properties": int(total_properties),
                "total_bookings": int(total_bookings),
                "monthly_earnings": monthly_earnings,
                "average_rating": round(avg_rating, 1),
                "properties_this_month": int(properties_this_month),
                "bookings_this_month": int(bookings_this_month),
                "earnings_growth_pct": earnings_growth,
                "rating_change": rating_change,
                "unread_notifications": int(unread_notifications),
                "host_name": host["name"],
                "host_email": host["email"],
                "is_approved": bool(host["is_approved"])
            }

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": stats}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading host stats: {str(e)}"}), 500

    @app.post("/api/host/properties")
    def host_properties():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error

        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT p.id, p.title, p.image_url, p.property_type, p.address, p.price_per_night, p.max_guests, p.created_at,
                       COALESCE(AVG(r.rating), 0) AS average_rating,
                       COUNT(DISTINCT r.id) AS review_count,
                       COUNT(DISTINCT CASE WHEN b.status != 'Cancelled' THEN b.id END) AS bookings,
                       COALESCE(SUM(CASE WHEN pay.status = 'Success' THEN pay.amount ELSE 0 END), 0) AS earnings
                FROM Properties p
                LEFT JOIN Reviews r ON r.property_id = p.id
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                WHERE p.host_id = %s
                GROUP BY p.id, p.title, p.image_url, p.property_type, p.address, p.price_per_night, p.max_guests, p.created_at
                ORDER BY p.id DESC
                """,
                (host_id,)
            )
            properties = cursor.fetchall()

            for prop in properties:
                prop["price_per_night"] = float(prop["price_per_night"])
                prop["average_rating"] = round(float(prop["average_rating"] or 0), 1)
                prop["earnings"] = float(prop["earnings"] or 0)
                prop["created_at"] = str(prop["created_at"])
                cursor.execute(
                    """
                    SELECT COUNT(*) AS active FROM Bookings
                    WHERE property_id = %s AND status = 'Confirmed'
                      AND check_out >= CURRENT_DATE()
                    """,
                    (prop["id"],)
                )
                active = cursor.fetchone()["active"]
                max_days = 30
                cursor.execute(
                    """
                    SELECT COALESCE(SUM(DATEDIFF(
                        LEAST(check_out, LAST_DAY(CURRENT_DATE())),
                        GREATEST(check_in, DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'))
                    ) + 1), 0) AS booked_days
                    FROM Bookings
                    WHERE property_id = %s AND status != 'Cancelled'
                      AND check_in <= LAST_DAY(CURRENT_DATE())
                      AND check_out >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                    """,
                    (prop["id"],)
                )
                booked_days = cursor.fetchone()["booked_days"] or 0
                occupancy = min(100, round((booked_days / max_days) * 100)) if max_days else 0
                prop["occupancy_pct"] = int(occupancy)
                prop["active_bookings"] = int(active)

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": properties}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading host properties: {str(e)}"}), 500

    @app.post("/api/host/bookings")
    def host_bookings():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error

        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT b.id, b.check_in, b.check_out, b.total_price, b.status,
                       b.guests_count, b.special_requests, b.created_at,
                       p.id AS property_id, p.title AS property_title,
                       p.image_url, p.property_type, p.address AS property_address,
                       guest_user.name AS guest_name, guest_user.email AS guest_email,
                       guest_user.profile_picture AS guest_avatar,
                       pay.payment_method, pay.transaction_id, pay.amount AS payment_amount
                FROM Bookings b
                JOIN Properties p ON p.id = b.property_id
                JOIN Guests g ON g.id = b.guest_id
                JOIN Users guest_user ON guest_user.id = g.user_id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                WHERE p.host_id = %s
                ORDER BY b.created_at DESC
                LIMIT 50
                """,
                (host_id,)
            )
            bookings = cursor.fetchall()
            for booking in bookings:
                booking["total_price"] = float(booking["total_price"])
                booking["payment_amount"] = float(booking["payment_amount"] or 0)
                booking["check_in"] = str(booking["check_in"])
                booking["check_out"] = str(booking["check_out"])
                booking["created_at"] = str(booking["created_at"])
                from datetime import datetime as _dtx
                ci = _dtx.strptime(booking["check_in"], '%Y-%m-%d').date()
                co = _dtx.strptime(booking["check_out"], '%Y-%m-%d').date()
                booking["nights"] = (co - ci).days
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": bookings}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading host bookings: {str(e)}"}), 500

    @app.post("/api/host/checkins")
    def host_checkins():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error

        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT b.id, b.check_in, b.check_out, b.status,
                       p.title AS property_title, p.max_guests,
                       guest_user.name AS guest_name,
                       guest_user.email AS guest_email,
                       guest_user.profile_picture AS guest_avatar
                FROM Bookings b
                JOIN Properties p ON p.id = b.property_id
                JOIN Guests g ON g.id = b.guest_id
                JOIN Users guest_user ON guest_user.id = g.user_id
                WHERE p.host_id = %s
                  AND b.status = 'Confirmed'
                  AND b.check_in >= CURRENT_DATE()
                ORDER BY b.check_in ASC
                LIMIT 10
                """,
                (host_id,)
            )
            checkins = cursor.fetchall()
            for item in checkins:
                item["check_in"] = str(item["check_in"])
                item["check_out"] = str(item["check_out"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": checkins}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading check-ins: {str(e)}"}), 500

    @app.post("/api/host/reviews")
    def host_reviews():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error

        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT r.id, r.rating, r.comment, r.created_at,
                       p.title AS property_title,
                       guest_user.name AS guest_name,
                       guest_user.profile_picture AS guest_avatar
                FROM Reviews r
                JOIN Properties p ON p.id = r.property_id
                JOIN Guests g ON g.id = r.guest_id
                JOIN Users guest_user ON guest_user.id = g.user_id
                WHERE p.host_id = %s
                ORDER BY r.created_at DESC
                LIMIT 10
                """,
                (host_id,)
            )
            reviews = cursor.fetchall()
            for review in reviews:
                review["created_at"] = str(review["created_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": reviews}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading reviews: {str(e)}"}), 500

    @app.post("/api/host/earnings-chart")
    def host_earnings_chart():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error

        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT
                    DATE_FORMAT(m.month_start, '%b') AS month_label,
                    m.month_start,
                    COALESCE((
                        SELECT SUM(pay.amount)
                        FROM Payments pay
                        JOIN Bookings b ON b.id = pay.booking_id
                        JOIN Properties p ON p.id = b.property_id
                        WHERE p.host_id = %s AND pay.status = 'Success'
                          AND DATE_FORMAT(pay.created_at, '%Y-%m') = DATE_FORMAT(m.month_start, '%Y-%m')
                    ), 0) AS earnings,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM Bookings b
                        JOIN Properties p ON p.id = b.property_id
                        WHERE p.host_id = %s AND b.status != 'Cancelled'
                          AND DATE_FORMAT(b.created_at, '%Y-%m') = DATE_FORMAT(m.month_start, '%Y-%m')
                    ), 0) AS bookings,
                    COALESCE((
                        SELECT ROUND(AVG(
                            LEAST(100, GREATEST(0,
                                (SELECT COUNT(*) FROM Bookings bx
                                 WHERE bx.property_id = p2.id AND bx.status != 'Cancelled'
                                   AND DATE_FORMAT(bx.created_at, '%Y-%m') = DATE_FORMAT(m.month_start, '%Y-%m')
                                ) * 10
                            ))
                        ), 0)
                        FROM Properties p2 WHERE p2.host_id = %s
                    ), 0) AS occupancy
                FROM (
                    SELECT DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL seq MONTH) AS month_start
                    FROM (
                        SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
                    ) months
                ) m
                ORDER BY m.month_start ASC
                """,
                (host_id, host_id, host_id)
            )
            chart_data = cursor.fetchall()
            for row in chart_data:
                row["earnings"] = float(row["earnings"] or 0)
                row["bookings"] = int(row["bookings"] or 0)
                row["occupancy"] = float(row["occupancy"] or 0)
                row["month_start"] = str(row["month_start"])

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": chart_data}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading earnings chart: {str(e)}"}), 500

    @app.post("/api/admin/stats_v1")
    def admin_stats_v1():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            def scalar(query):
                cursor.execute(query)
                row = cursor.fetchone()
                return list(row.values())[0] if row else 0

            stats = {
                "total_users": scalar("SELECT COUNT(*) AS count FROM Users"),
                "total_guests": scalar("SELECT COUNT(*) AS count FROM Guests"),
                "total_hosts": scalar("SELECT COUNT(*) AS count FROM Hosts"),
                "active_hosts": scalar("SELECT COUNT(*) AS count FROM Hosts WHERE is_approved = TRUE"),
                "pending_hosts": scalar("SELECT COUNT(*) AS count FROM Hosts WHERE is_approved = FALSE"),
                "total_properties": scalar("SELECT COUNT(*) AS count FROM Properties"),
                "total_bookings": scalar("SELECT COUNT(*) AS count FROM Bookings"),
                "active_bookings": scalar("SELECT COUNT(*) AS count FROM Bookings WHERE status != 'Cancelled'"),
                "total_revenue": float(scalar("SELECT COALESCE(SUM(amount), 0) AS total FROM Payments WHERE status = 'Success'")),
                "total_reviews": scalar("SELECT COUNT(*) AS count FROM Reviews")
            }

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": stats}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading admin stats: {str(e)}"}), 500

    @app.post("/api/admin/guests")
    def admin_guests():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT u.id, g.id AS guest_id, u.name, u.email, u.created_at,
                       COALESCE(g.bio, '') AS bio,
                       COUNT(DISTINCT b.id) AS bookings,
                       COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_price ELSE 0 END), 0) AS booking_value
                FROM Users u
                JOIN Guests g ON g.user_id = u.id
                LEFT JOIN Bookings b ON b.guest_id = g.id
                GROUP BY u.id, g.id, u.name, u.email, u.created_at, g.bio
                ORDER BY u.id ASC
                """
            )
            guests = cursor.fetchall()
            for guest in guests:
                guest["booking_value"] = float(guest["booking_value"] or 0)
                guest["created_at"] = str(guest["created_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": guests}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading guests: {str(e)}"}), 500

    @app.post("/api/admin/hosts")
    def admin_hosts():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT u.id, h.id AS host_id, u.name, u.email, h.is_approved, h.created_at,
                       COALESCE(h.bio, '') AS bio,
                       COALESCE(h.gender, '') AS gender,
                       COALESCE(h.phone, '') AS phone,
                       COALESCE(h.city, '') AS city,
                       COUNT(DISTINCT p.id) AS properties,
                       COUNT(DISTINCT b.id) AS bookings,
                       COALESCE(SUM(CASE WHEN pay.status = 'Success' THEN pay.amount ELSE 0 END), 0) AS revenue
                FROM Users u
                JOIN Hosts h ON h.user_id = u.id
                LEFT JOIN Properties p ON p.host_id = h.id
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                GROUP BY u.id, h.id, u.name, u.email, h.is_approved, h.created_at, h.bio, h.gender, h.phone, h.city
                ORDER BY h.id ASC
                """
            )
            hosts = cursor.fetchall()
            for host in hosts:
                host["id"] = host.get("host_id") or host.get("id")
                host["status"] = "approved" if host["is_approved"] else "pending"
                del host["is_approved"]
                if "host_id" in host:
                    del host["host_id"]
                host["propertiesCount"] = host.pop("properties", 0) or 0
                host["bookingsCount"] = host.pop("bookings", 0) or 0
                host["revenue"] = float(host["revenue"] or 0)
                host["createdAt"] = str(host.pop("created_at", ""))
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": hosts}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading hosts: {str(e)}"}), 500

    @app.post("/api/admin/properties")
    def admin_properties():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT p.id, p.title, p.address, p.price_per_night, p.max_guests, p.created_at,
                       u.name AS host_name, u.email AS host_email,
                       COUNT(DISTINCT b.id) AS bookings,
                       COALESCE(AVG(r.rating), 0) AS average_rating
                FROM Properties p
                JOIN Hosts h ON p.host_id = h.id
                JOIN Users u ON h.user_id = u.id
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Reviews r ON r.property_id = p.id
                GROUP BY p.id, p.title, p.address, p.price_per_night, p.max_guests, p.created_at, u.name, u.email
                ORDER BY p.id DESC
                """
            )
            properties = cursor.fetchall()
            for prop in properties:
                prop["price_per_night"] = float(prop["price_per_night"])
                prop["average_rating"] = float(prop["average_rating"] or 0)
                prop["created_at"] = str(prop["created_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": properties}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading properties: {str(e)}"}), 500

    @app.post("/api/admin/bookings")
    def admin_bookings():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT b.id, b.check_in, b.check_out, b.total_price, b.status,
                       b.guests_count, b.created_at,
                       p.title AS property_title, p.property_type, p.address AS property_address,
                       guest_user.name AS guest_name, guest_user.email AS guest_email,
                       host_user.name AS host_name, host_user.email AS host_email,
                       pay.payment_method, pay.transaction_id, pay.amount AS payment_amount
                FROM Bookings b
                JOIN Properties p ON p.id = b.property_id
                JOIN Guests g ON g.id = b.guest_id
                JOIN Users guest_user ON guest_user.id = g.user_id
                JOIN Hosts h ON h.id = p.host_id
                JOIN Users host_user ON host_user.id = h.user_id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                ORDER BY b.id DESC
                LIMIT 50
                """
            )
            bookings = cursor.fetchall()
            for booking in bookings:
                booking["total_price"] = float(booking["total_price"])
                booking["payment_amount"] = float(booking["payment_amount"] or 0)
                booking["check_in"] = str(booking["check_in"])
                booking["check_out"] = str(booking["check_out"])
                booking["created_at"] = str(booking["created_at"])
                from datetime import datetime as _dtx2
                ci2 = _dtx2.strptime(booking["check_in"], '%Y-%m-%d').date()
                co2 = _dtx2.strptime(booking["check_out"], '%Y-%m-%d').date()
                booking["nights"] = (co2 - ci2).days
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": bookings}), 200

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading bookings: {str(e)}"}), 500

    # ──────────────────────────────────────────────
    # HOST – Profile
    # ──────────────────────────────────────────────
    @app.get("/api/host/profile")
    def host_profile_get():
        token = request.headers.get('X-Auth-Token', '')
        host, error = _host_guard({'token': token})
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT u.id, u.name, u.email, u.profile_picture, h.bio, h.is_approved, h.created_at
                FROM Users u
                JOIN Hosts h ON h.user_id = u.id
                WHERE u.id = %s
                """,
                (host["id"],)
            )
            profile = cursor.fetchone()
            cursor.close()
            conn.close()
            if profile:
                profile["created_at"] = str(profile["created_at"])
                profile["is_approved"] = bool(profile["is_approved"])
            return jsonify({"status": "success", "data": profile}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/profile")
    def host_profile_update():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        name = body.get('name', '').strip()
        bio = body.get('bio', '').strip()
        profile_picture = body.get('profile_picture', '').strip()
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            if name:
                cursor.execute("UPDATE Users SET name = %s WHERE id = %s", (name, host["id"]))
            if profile_picture:
                cursor.execute("UPDATE Users SET profile_picture = %s WHERE id = %s", (profile_picture, host["id"]))
            cursor.execute("UPDATE Hosts SET bio = %s WHERE user_id = %s", (bio, host["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Profile updated"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/change_password")
    def host_change_password():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        old_password = body.get('old_password', '')
        new_password = body.get('new_password', '')
        if not old_password or not new_password:
            return jsonify({"status": "error", "message": "Both passwords are required"}), 400
        if len(new_password) < 8:
            return jsonify({"status": "error", "message": "New password must be at least 8 characters"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT password_hash, salt FROM Users WHERE id = %s", (host["id"],))
            user = cursor.fetchone()
            old_hash = hash_password(old_password, user['salt'])
            if old_hash != user['password_hash']:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Current password is incorrect"}), 400
            new_salt = generate_salt()
            new_hash = hash_password(new_password, new_salt)
            cursor.execute("UPDATE Users SET password_hash = %s, salt = %s WHERE id = %s", (new_hash, new_salt, host["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Password changed successfully"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # HOST – Notifications
    # ──────────────────────────────────────────────
    @app.get("/api/host/notifications")
    def host_notifications():
        token = request.headers.get('X-Auth-Token', '')
        host, error = _host_guard({'token': token})
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, message, is_read, created_at FROM Notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
                (host["id"],)
            )
            notifications = cursor.fetchall()
            for n in notifications:
                n["created_at"] = str(n["created_at"])
                n["is_read"] = bool(n["is_read"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": notifications}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/notifications/read")
    def host_notifications_read():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        notif_id = body.get('notification_id')
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            if notif_id:
                cursor.execute("UPDATE Notifications SET is_read = TRUE WHERE id = %s AND user_id = %s", (notif_id, host["id"]))
            else:
                cursor.execute("UPDATE Notifications SET is_read = TRUE WHERE user_id = %s", (host["id"],))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Notifications marked as read"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/notifications/delete")
    def host_notifications_delete():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        notif_id = body.get('notification_id')
        if not notif_id:
            return jsonify({"status": "error", "message": "notification_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Notifications WHERE id = %s AND user_id = %s", (notif_id, host["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Notification deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # HOST – Earnings (detailed)
    # ──────────────────────────────────────────────
    @app.post("/api/host/earnings")
    def host_earnings():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            total = float((lambda q: (cursor.execute(q, (host_id,)) or True) and (cursor.fetchone() or {}).get('total', 0))(
                "SELECT COALESCE(SUM(pay.amount), 0) AS total FROM Payments pay "
                "JOIN Bookings b ON b.id = pay.booking_id JOIN Properties p ON p.id = b.property_id "
                "WHERE p.host_id = %s AND pay.status = 'Success'"
            ))
            this_month = float((lambda q: (cursor.execute(q, (host_id,)) or True) and (cursor.fetchone() or {}).get('total', 0))(
                "SELECT COALESCE(SUM(pay.amount), 0) AS total FROM Payments pay "
                "JOIN Bookings b ON b.id = pay.booking_id JOIN Properties p ON p.id = b.property_id "
                "WHERE p.host_id = %s AND pay.status = 'Success' "
                "AND MONTH(pay.created_at) = MONTH(CURRENT_DATE()) AND YEAR(pay.created_at) = YEAR(CURRENT_DATE())"
            ))
            last_month = float((lambda q: (cursor.execute(q, (host_id,)) or True) and (cursor.fetchone() or {}).get('total', 0))(
                "SELECT COALESCE(SUM(pay.amount), 0) AS total FROM Payments pay "
                "JOIN Bookings b ON b.id = pay.booking_id JOIN Properties p ON p.id = b.property_id "
                "WHERE p.host_id = %s AND pay.status = 'Success' "
                "AND MONTH(pay.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) "
                "AND YEAR(pay.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))"
            ))
            this_year = float((lambda q: (cursor.execute(q, (host_id,)) or True) and (cursor.fetchone() or {}).get('total', 0))(
                "SELECT COALESCE(SUM(pay.amount), 0) AS total FROM Payments pay "
                "JOIN Bookings b ON b.id = pay.booking_id JOIN Properties p ON p.id = b.property_id "
                "WHERE p.host_id = %s AND pay.status = 'Success' AND YEAR(pay.created_at) = YEAR(CURRENT_DATE())"
            ))

            cursor.execute(
                """
                SELECT p.title, pay.amount, pay.payment_method, pay.created_at, b.id AS booking_id
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                JOIN Properties p ON p.id = b.property_id
                WHERE p.host_id = %s AND pay.status = 'Success'
                ORDER BY pay.created_at DESC LIMIT 20
                """,
                (host_id,)
            )
            recent = cursor.fetchall()
            for r in recent:
                r["amount"] = float(r["amount"])
                r["created_at"] = str(r["created_at"])

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": {
                "total_earnings": total,
                "this_month": this_month,
                "last_month": last_month,
                "this_year": this_year,
                "recent_payments": recent
            }}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading earnings: {str(e)}"}), 500

    # ──────────────────────────────────────────────
    # HOST – Property CRUD
    # ──────────────────────────────────────────────
    @app.post("/api/host/property/create")
    def host_property_create():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        title = body.get('title', '').strip()
        description = body.get('description', '').strip()
        address = body.get('address', '').strip()
        price = body.get('price_per_night')
        max_guests = body.get('max_guests')
        image_url = body.get('image_url', '').strip()
        property_type = body.get('property_type', 'House')
        amenities = body.get('amenities', [])
        if not title or not description or not address or not price or not max_guests:
            return jsonify({"status": "error", "message": "All fields are required"}), 400
        if property_type not in ('Apartment', 'House', 'Villa'):
            property_type = 'House'
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO Properties (host_id, title, description, image_url, property_type, address, price_per_night, max_guests) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (host["host_id"], title, description, image_url or None, property_type, address, float(price), int(max_guests))
            )
            prop_id = cursor.lastrowid
            for amenity in amenities:
                if amenity.strip():
                    cursor.execute("INSERT INTO Amenities (property_id, name) VALUES (%s, %s)", (prop_id, amenity.strip()))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Property created", "data": {"property_id": prop_id}}), 201
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/property/update")
    def host_property_update():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        prop_id = body.get('property_id')
        if not prop_id:
            return jsonify({"status": "error", "message": "property_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM Properties WHERE id = %s AND host_id = %s", (prop_id, host["host_id"]))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Property not found or unauthorized"}), 404
            updates = []
            params = []
            for field in ['title', 'description', 'address']:
                if field in body and body[field]:
                    updates.append(f"{field} = %s")
                    params.append(body[field].strip())
            if 'price_per_night' in body:
                updates.append("price_per_night = %s")
                params.append(float(body['price_per_night']))
            if 'max_guests' in body:
                updates.append("max_guests = %s")
                params.append(int(body['max_guests']))
            if 'image_url' in body:
                updates.append("image_url = %s")
                val = body['image_url'].strip() if body['image_url'] else None
                params.append(val)
            if 'property_type' in body:
                pt = body['property_type']
                if pt in ('Apartment', 'House', 'Villa'):
                    updates.append("property_type = %s")
                    params.append(pt)
            if updates:
                params.append(prop_id)
                cursor.execute(f"UPDATE Properties SET {', '.join(updates)} WHERE id = %s", params)
            if 'amenities' in body:
                cursor.execute("DELETE FROM Amenities WHERE property_id = %s", (prop_id,))
                for amenity in body['amenities']:
                    if amenity.strip():
                        cursor.execute("INSERT INTO Amenities (property_id, name) VALUES (%s, %s)", (prop_id, amenity.strip()))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Property updated"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/property/delete")
    def host_property_delete():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        prop_id = body.get('property_id')
        if not prop_id:
            return jsonify({"status": "error", "message": "property_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Properties WHERE id = %s AND host_id = %s", (prop_id, host["host_id"]))
            affected = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            if affected == 0:
                return jsonify({"status": "error", "message": "Property not found or unauthorized"}), 404
            return jsonify({"status": "success", "message": "Property deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.get("/api/host/property/<int:property_id>")
    def host_property_detail(property_id):
        token = request.headers.get('X-Auth-Token', '')
        host, error = _host_guard({'token': token})
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT p.*, GROUP_CONCAT(a.name) AS amenities_list
                FROM Properties p
                LEFT JOIN Amenities a ON a.property_id = p.id
                WHERE p.id = %s AND p.host_id = %s
                GROUP BY p.id
                """,
                (property_id, host["host_id"])
            )
            prop = cursor.fetchone()
            cursor.close()
            conn.close()
            if not prop:
                return jsonify({"status": "error", "message": "Property not found"}), 404
            prop["price_per_night"] = float(prop["price_per_night"])
            prop["created_at"] = str(prop["created_at"])
            prop["amenities"] = (prop.get("amenities_list") or "").split(",") if prop.get("amenities_list") else []
            prop.pop("amenities_list", None)
            return jsonify({"status": "success", "data": prop}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # HOST – Reports
    # ──────────────────────────────────────────────
    @app.post("/api/host/reports")
    def host_reports():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        host_id = host["host_id"]
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                """
                SELECT DATE_FORMAT(pay.created_at, '%Y-%m') AS month,
                       COALESCE(SUM(pay.amount), 0) AS revenue,
                       COUNT(DISTINCT b.id) AS bookings
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                JOIN Properties p ON p.id = b.property_id
                WHERE p.host_id = %s AND pay.status = 'Success'
                GROUP BY month ORDER BY month DESC LIMIT 12
                """,
                (host_id,)
            )
            revenue_by_month = cursor.fetchall()
            for r in revenue_by_month:
                r["revenue"] = float(r["revenue"])
                r["bookings"] = int(r["bookings"])

            cursor.execute(
                """
                SELECT p.title,
                       COUNT(DISTINCT b.id) AS total_bookings,
                       COALESCE(SUM(CASE WHEN pay.status = 'Success' THEN pay.amount ELSE 0 END), 0) AS revenue,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       COUNT(DISTINCT r.id) AS review_count
                FROM Properties p
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                LEFT JOIN Reviews r ON r.property_id = p.id
                WHERE p.host_id = %s
                GROUP BY p.id, p.title
                ORDER BY revenue DESC
                """,
                (host_id,)
            )
            by_property = cursor.fetchall()
            for bp in by_property:
                bp["revenue"] = float(bp["revenue"])
                bp["avg_rating"] = round(float(bp["avg_rating"] or 0), 1)
                bp["total_bookings"] = int(bp["total_bookings"])
                bp["review_count"] = int(bp["review_count"])

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": {
                "revenue_by_month": revenue_by_month,
                "by_property": by_property
            }}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading reports: {str(e)}"}), 500

    # ──────────────────────────────────────────────
    # BOOKING SYSTEM – Availability
    # ──────────────────────────────────────────────
    @app.get("/api/properties/<int:property_id>/availability")
    def property_availability(property_id: int):
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT check_in, check_out
                FROM Bookings
                WHERE property_id = %s AND status IN ('Pending', 'Confirmed', 'Checked-In')
                  AND check_out >= CURRENT_DATE()
                ORDER BY check_in ASC
                """,
                (property_id,)
            )
            booked = cursor.fetchall()
            for b in booked:
                b['check_in'] = str(b['check_in'])
                b['check_out'] = str(b['check_out'])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": booked}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # BOOKING SYSTEM – Guest helpers
    # ──────────────────────────────────────────────
    def _resolve_guest_id(cursor, user_id):
        cursor.execute("SELECT id FROM Guests WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        if row:
            return row['id']
        cursor.execute("INSERT INTO Guests (user_id) VALUES (%s)", (user_id,))
        return cursor.lastrowid

    def _get_property_owner_user_id(cursor, property_id):
        cursor.execute(
            "SELECT u.id FROM Properties p JOIN Hosts h ON p.host_id = h.id JOIN Users u ON h.user_id = u.id WHERE p.id = %s",
            (property_id,)
        )
        row = cursor.fetchone()
        return row['id'] if row else None

    def _create_notification(cursor, user_id, message):
        cursor.execute("INSERT INTO Notifications (user_id, message) VALUES (%s, %s)", (user_id, message))

    def _check_overlap(cursor, property_id, check_in, check_out, exclude_booking_id=None):
        sql = """
            SELECT COUNT(*) AS cnt FROM Bookings
            WHERE property_id = %s AND status IN ('Pending', 'Confirmed', 'Checked-In')
              AND check_in < %s AND check_out > %s
        """
        params = [property_id, check_out, check_in]
        if exclude_booking_id:
            sql += " AND id != %s"
            params.append(exclude_booking_id)
        cursor.execute(sql, params)
        return cursor.fetchone()['cnt'] > 0

    # ──────────────────────────────────────────────
    # BOOKING SYSTEM – Create Booking
    # ──────────────────────────────────────────────
    @app.post("/api/bookings/create")
    def create_booking():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error

        property_id = body.get('property_id')
        check_in = body.get('check_in', '').strip()
        check_out = body.get('check_out', '').strip()
        guests_count = int(body.get('guests', 1))
        special_requests = body.get('special_requests', '').strip()
        payment_method = body.get('payment_method', 'Credit Card')

        if not property_id or not check_in or not check_out:
            return jsonify({"status": "error", "message": "property_id, check_in, and check_out are required"}), 400

        from datetime import datetime as _dt
        try:
            ci = _dt.strptime(check_in, '%Y-%m-%d').date()
            co = _dt.strptime(check_out, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid date format (use YYYY-MM-DD)"}), 400

        if co <= ci:
            return jsonify({"status": "error", "message": "Check-out must be after check-in"}), 400

        valid_methods = ('Credit Card', 'Debit Card', 'UPI', 'Net Banking')
        if payment_method not in valid_methods:
            payment_method = 'Credit Card'

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                "SELECT id, host_id, price_per_night, max_guests FROM Properties WHERE id = %s",
                (property_id,)
            )
            prop = cursor.fetchone()
            if not prop:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Property not found"}), 404

            if guests_count > prop['max_guests']:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": f"This property can accommodate a maximum of {prop['max_guests']} guests"}), 400

            if _check_overlap(cursor, property_id, check_in, check_out):
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "This property is unavailable for the selected dates"}), 409

            nights = (co - ci).days
            price_per_night = float(prop['price_per_night'])
            subtotal = price_per_night * nights
            service_fee = round(subtotal * 0.1, 2)
            total_price = subtotal + service_fee

            guest_id = _resolve_guest_id(cursor, guest['id'])

            cursor.execute(
                """INSERT INTO Bookings (property_id, guest_id, check_in, check_out, total_price, guests_count, special_requests, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending')""",
                (property_id, guest_id, check_in, check_out, total_price, guests_count, special_requests or None)
            )
            booking_id = cursor.lastrowid

            import uuid as _uuid
            transaction_id = f"TXN-{_uuid.uuid4().hex[:12].upper()}"
            cursor.execute(
                """INSERT INTO Payments (booking_id, amount, payment_method, status, transaction_id)
                   VALUES (%s, %s, %s, 'Success', %s)""",
                (booking_id, total_price, payment_method, transaction_id)
            )

            cursor.execute("UPDATE Bookings SET status = 'Confirmed' WHERE id = %s", (booking_id,))

            host_user_id = _get_property_owner_user_id(cursor, property_id)
            if host_user_id:
                _create_notification(cursor, host_user_id,
                    f"New booking #{booking_id}: {guest['name']} booked your property for {check_in} to {check_out}")

            cursor.execute("SELECT id FROM Users WHERE role = 'Admin' LIMIT 1")
            admin_row = cursor.fetchone()
            if admin_row:
                _create_notification(cursor, admin_row['id'],
                    f"New booking #{booking_id} confirmed: {guest['name']} booked property #{property_id} for ₹{total_price:.0f}")

            _create_notification(cursor, guest['id'],
                f"Your booking #{booking_id} is confirmed! Check-in: {check_in}, Check-out: {check_out}. Total: ₹{total_price:.0f}")

            cursor.execute(
                """
                SELECT p.title FROM Properties p WHERE p.id = %s
                """,
                (property_id,)
            )
            prop_title_row = cursor.fetchone()

            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({
                "status": "success",
                "message": "Booking confirmed successfully",
                "data": {
                    "booking_id": booking_id,
                    "transaction_id": transaction_id,
                    "total_price": total_price,
                    "nights": nights,
                    "service_fee": service_fee,
                    "property_title": prop_title_row['title'] if prop_title_row else '',
                    "check_in": check_in,
                    "check_out": check_out
                }
            }), 201

        except Exception as e:
            return jsonify({"status": "error", "message": f"Error creating booking: {str(e)}"}), 500

    # ──────────────────────────────────────────────
    # BOOKING SYSTEM – Guest Bookings List
    # ──────────────────────────────────────────────
    @app.post("/api/guest/bookings")
    def guest_bookings():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT b.id, b.check_in, b.check_out, b.total_price, b.status,
                       b.guests_count, b.special_requests, b.created_at,
                       p.id AS property_id, p.title AS property_title,
                       p.address AS property_address, p.image_url, p.property_type,
                       pay.payment_method, pay.transaction_id, pay.amount AS payment_amount
                FROM Bookings b
                JOIN Properties p ON p.id = b.property_id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                WHERE b.guest_id = %s
                ORDER BY b.created_at DESC
                """,
                (guest['guest_id'],)
            )
            bookings = cursor.fetchall()
            for b in bookings:
                b['total_price'] = float(b['total_price'])
                b['payment_amount'] = float(b['payment_amount'] or 0)
                b['check_in'] = str(b['check_in'])
                b['check_out'] = str(b['check_out'])
                b['created_at'] = str(b['created_at'])
                ci = _dt_convert(b['check_in'])
                co = _dt_convert(b['check_out'])
                b['nights'] = (co - ci).days
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": bookings}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading bookings: {str(e)}"}), 500

    @app.post("/api/guest/bookings/cancel")
    def guest_cancel_booking():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error

        booking_id = body.get('booking_id')
        if not booking_id:
            return jsonify({"status": "error", "message": "booking_id is required"}), 400

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, status, property_id FROM Bookings WHERE id = %s AND guest_id = %s",
                (booking_id, guest['guest_id'])
            )
            booking = cursor.fetchone()
            if not booking:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Booking not found"}), 404
            if booking['status'] not in ('Pending', 'Confirmed'):
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": f"Cannot cancel a booking with status '{booking['status']}'"}), 400

            cursor.execute("UPDATE Bookings SET status = 'Cancelled' WHERE id = %s", (booking_id,))

            host_user_id = _get_property_owner_user_id(cursor, booking['property_id'])
            if host_user_id:
                _create_notification(cursor, host_user_id,
                    f"Booking #{booking_id} has been cancelled by the guest.")

            _create_notification(cursor, guest['id'],
                f"Your booking #{booking_id} has been cancelled.")

            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Booking cancelled"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # BOOKING SYSTEM – Host Enhanced Booking Action
    # ──────────────────────────────────────────────
    @app.post("/api/host/booking/action")
    def host_booking_action():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        booking_id = body.get('booking_id')
        action = body.get('action')
        valid_actions = ('confirm', 'cancel', 'checkin', 'complete')
        if not booking_id or action not in valid_actions:
            return jsonify({"status": "error", "message": "booking_id and valid action required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT b.id, b.status, b.guest_id FROM Bookings b JOIN Properties p ON p.id = b.property_id WHERE b.id = %s AND p.host_id = %s",
                (booking_id, host["host_id"])
            )
            booking = cursor.fetchone()
            if not booking:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Booking not found or unauthorized"}), 404

            status_map = {
                'confirm': 'Confirmed',
                'cancel': 'Cancelled',
                'checkin': 'Checked-In',
                'complete': 'Completed'
            }
            new_status = status_map[action]

            allowed_transitions = {
                'confirm': ['Pending'],
                'cancel': ['Pending', 'Confirmed', 'Checked-In'],
                'checkin': ['Confirmed'],
                'complete': ['Checked-In']
            }
            if booking['status'] not in allowed_transitions[action]:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": f"Cannot {action} a booking with status '{booking['status']}'"}), 400

            cursor.execute("UPDATE Bookings SET status = %s WHERE id = %s", (new_status, booking_id))

            guest_user_cursor = conn.cursor(dictionary=True)
            guest_user_cursor.execute("SELECT user_id FROM Guests WHERE id = %s", (booking['guest_id'],))
            guest_user = guest_user_cursor.fetchone()
            guest_user_cursor.close()

            if guest_user:
                _create_notification(cursor, guest_user['user_id'],
                    f"Your booking #{booking_id} status updated to: {new_status}")

            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": f"Booking {new_status.lower()}"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # AUTH – Host Status Check
    # ──────────────────────────────────────────────
    @app.post("/api/auth/host-status")
    def host_status():
        body = request.get_json(silent=True) or {}
        token = body.get('token', '') or request.headers.get('X-Auth-Token', '')
        if not token:
            return jsonify({"status": "error", "message": "Token required"}), 401
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT u.id, u.name, u.email, u.role, h.is_approved,
                       COALESCE(h.gender, '') AS gender,
                       COALESCE(h.phone, '') AS phone,
                       COALESCE(h.city, '') AS city
                FROM Sessions s
                JOIN Users u ON s.user_id = u.id
                JOIN Hosts h ON h.user_id = u.id
                WHERE s.session_token = %s AND s.expires_at > NOW() AND u.role = 'Host'
                """,
                (token,)
            )
            host = cursor.fetchone()
            cursor.close()
            conn.close()
            if not host:
                return jsonify({"status": "error", "message": "Not authenticated"}), 401
            return jsonify({
                "status": "success",
                "data": {
                    "is_approved": bool(host["is_approved"]),
                    "name": host["name"],
                    "email": host["email"],
                    "gender": host["gender"],
                    "phone": host["phone"],
                    "city": host["city"]
                }
            }), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/auth/host-registered")
    def host_registered():
        body = request.get_json(silent=True) or {}
        token = body.get('token', '') or request.headers.get('X-Auth-Token', '')
        if not token:
            return jsonify({"status": "error", "message": "Token required"}), 401
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT u.id, u.name, u.email, h.id AS host_id
                FROM Sessions s
                JOIN Users u ON s.user_id = u.id
                JOIN Hosts h ON h.user_id = u.id
                WHERE s.session_token = %s AND s.expires_at > NOW() AND u.role = 'Host'
                """,
                (token,)
            )
            host = cursor.fetchone()
            if not host:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Not authenticated"}), 401

            cursor.execute("SELECT id FROM Users WHERE role = 'Admin' LIMIT 1")
            admin = cursor.fetchone()
            if admin:
                _create_notification(cursor, admin['id'],
                    f"New host registration: {host['name']} ({host['email']}) is awaiting approval.")

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Admin notified"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Host Approval
    # ──────────────────────────────────────────────
    @app.post("/api/admin/host/approve")
    def admin_host_approve():
        body = request.get_json(silent=True) or {}
        admin, error = _admin_guard(body)
        if error:
            return error
        host_id = body.get('host_id')
        if not host_id:
            return jsonify({"status": "error", "message": "host_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id, user_id FROM Hosts WHERE id = %s", (host_id,))
            host = cursor.fetchone()
            if not host:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Host not found"}), 404
            cursor.execute("UPDATE Hosts SET is_approved = TRUE WHERE id = %s", (host_id,))
            _create_notification(cursor, host['user_id'],
                "Congratulations! Your host account has been approved. You can now access the Host Dashboard.")
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Host approved"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/host/reject")
    def admin_host_reject():
        body = request.get_json(silent=True) or {}
        admin, error = _admin_guard(body)
        if error:
            return error
        host_id = body.get('host_id')
        if not host_id:
            return jsonify({"status": "error", "message": "host_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id, user_id FROM Hosts WHERE id = %s", (host_id,))
            host = cursor.fetchone()
            if not host:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Host not found"}), 404
            cursor.execute("DELETE FROM Hosts WHERE id = %s", (host_id,))
            cursor.execute("UPDATE Users SET role = 'Guest' WHERE id = %s", (host['user_id'],))
            cursor.execute("SELECT id FROM Guests WHERE user_id = %s", (host['user_id'],))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO Guests (user_id) VALUES (%s)", (host['user_id'],))
            _create_notification(cursor, host['user_id'],
                "Your host registration was not approved. Your account has been set to Guest.")
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Host rejected"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/complaints")
    def host_complaints():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT c.*, u.name AS user_name, u.email AS user_email
                FROM Complaints c
                JOIN Users u ON c.user_id = u.id
                WHERE c.user_id = %s
                ORDER BY c.created_at DESC
            """, (host['id'],))
            complaints = cursor.fetchall()
            cursor.close()
            conn.close()
            for c in complaints:
                if c.get('created_at'):
                    c['created_at'] = str(c['created_at'])
                if c.get('updated_at'):
                    c['updated_at'] = str(c['updated_at'])
            return jsonify({"status": "success", "data": complaints}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/host/complaint/create")
    def host_complaint_create():
        body = request.get_json(silent=True) or {}
        host, error = _host_guard(body)
        if error:
            return error
        try:
            category = body.get('category', 'Other')
            subject = body.get('subject', '').strip()
            description = body.get('description', '').strip()
            if not subject:
                return jsonify({"status": "error", "message": "Subject is required"}), 400
            if not description:
                return jsonify({"status": "error", "message": "Description is required"}), 400
            full_subject = f"[{category}] {subject}"
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO Complaints (user_id, subject, description) VALUES (%s, %s, %s)",
                (host['id'], full_subject, description)
            )
            complaint_id = cursor.lastrowid
            try:
                cursor.execute("SELECT user_id FROM Admins LIMIT 1")
                admin_row = cursor.fetchone()
                if admin_row:
                    _create_notification(cursor, admin_row[0], f"New host complaint: {full_subject}")
            except Exception:
                pass
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": {"complaint_id": complaint_id}, "message": "Complaint submitted successfully"}), 201
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Enhanced Stats
    # ──────────────────────────────────────────────
    @app.post("/api/admin/stats")
    def admin_stats():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            def scalar(query, params=()):
                cursor.execute(query, params)
                row = cursor.fetchone()
                return list(row.values())[0] if row else 0

            total_revenue = float(scalar("SELECT COALESCE(SUM(amount), 0) AS total FROM Payments WHERE status = 'Success'"))
            host_revenue = float(scalar("""
                SELECT COALESCE(SUM(pay.amount), 0) AS total FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id JOIN Properties p ON p.id = b.property_id
                WHERE pay.status = 'Success'
            """))
            completed_bookings = scalar("SELECT COUNT(*) AS count FROM Bookings WHERE status = 'Completed'")
            cancelled_bookings = scalar("SELECT COUNT(*) AS count FROM Bookings WHERE status = 'Cancelled'")
            active_properties = scalar("""
                SELECT COUNT(DISTINCT p.id) FROM Properties p
                JOIN Hosts h ON p.host_id = h.id WHERE h.is_approved = TRUE
            """)
            users_this_month = scalar("""
                SELECT COUNT(*) FROM Users WHERE role = 'Guest'
                AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
            """)
            hosts_this_month = scalar("""
                SELECT COUNT(*) FROM Hosts
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
            """)
            bookings_this_month = scalar("""
                SELECT COUNT(*) FROM Bookings
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
            """)
            revenue_this_month = float(scalar("""
                SELECT COALESCE(SUM(amount), 0) FROM Payments WHERE status = 'Success'
                AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
            """))
            total_complaints = scalar("SELECT COUNT(*) AS count FROM Complaints")
            open_complaints = scalar("SELECT COUNT(*) AS count FROM Complaints WHERE status = 'Open'")

            user_growth = []
            cursor.execute("""
                SELECT DATE_FORMAT(created_at, '%b') AS month_label, COUNT(*) AS count
                FROM Users WHERE role = 'Guest'
                GROUP BY DATE_FORMAT(created_at, '%Y-%m'), month_label
                ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC LIMIT 6
            """)
            for row in cursor.fetchall():
                user_growth.append({"month_label": row["month_label"], "users": int(row["count"])})

            host_growth = []
            cursor.execute("""
                SELECT DATE_FORMAT(created_at, '%b') AS month_label, COUNT(*) AS count
                FROM Hosts
                GROUP BY DATE_FORMAT(created_at, '%Y-%m'), month_label
                ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC LIMIT 6
            """)
            for row in cursor.fetchall():
                host_growth.append({"month_label": row["month_label"], "hosts": int(row["count"])})

            booking_trends = []
            cursor.execute("""
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
                FROM Bookings GROUP BY month ORDER BY month DESC LIMIT 6
            """)
            for row in cursor.fetchall():
                booking_trends.append({"month": row["month"], "count": int(row["count"])})

            revenue_analytics = []
            cursor.execute("""
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                       COALESCE(SUM(amount), 0) AS revenue
                FROM Payments WHERE status = 'Success'
                GROUP BY month ORDER BY month DESC LIMIT 6
            """)
            for row in cursor.fetchall():
                revenue_analytics.append({"month": row["month"], "revenue": float(row["revenue"])})

            property_type_distribution = []
            cursor.execute("""
                SELECT property_type, COUNT(*) AS count FROM Properties GROUP BY property_type
            """)
            for row in cursor.fetchall():
                property_type_distribution.append({"type": row["property_type"] or "Unknown", "count": int(row["count"])})

            booking_status_distribution = []
            cursor.execute("""
                SELECT status, COUNT(*) AS count FROM Bookings GROUP BY status
            """)
            for row in cursor.fetchall():
                booking_status_distribution.append({"status": row["status"], "count": int(row["count"])})

            property_analytics = []
            cursor.execute("""
                SELECT p.property_type, COUNT(*) AS count,
                       COALESCE(AVG(r.rating), 0) AS avg_rating
                FROM Properties p
                LEFT JOIN Reviews r ON r.property_id = p.id
                GROUP BY p.property_type
            """)
            for row in cursor.fetchall():
                property_analytics.append({
                    "type": row["property_type"] or "Unknown",
                    "count": int(row["count"]),
                    "avg_rating": round(float(row["avg_rating"] or 0), 1)
                })

            occupancy_data = []
            cursor.execute("""
                SELECT p.title,
                    COALESCE(SUM(
                        DATEDIFF(LEAST(b.check_out, LAST_DAY(CURRENT_DATE())),
                                 GREATEST(b.check_in, DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'))) + 1
                    ), 0) AS booked_days
                FROM Properties p
                LEFT JOIN Bookings b ON b.property_id = p.id AND b.status != 'Cancelled'
                    AND b.check_in <= LAST_DAY(CURRENT_DATE())
                    AND b.check_out >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                GROUP BY p.id, p.title
                ORDER BY booked_days DESC LIMIT 10
            """)
            for row in cursor.fetchall():
                booked = int(row["booked_days"] or 0)
                occupancy_data.append({
                    "property": row["title"],
                    "occupancy": min(100, round((booked / 30) * 100)) if booked else 0
                })

            review_analytics = []
            cursor.execute("""
                SELECT rating, COUNT(*) AS count FROM Reviews GROUP BY rating ORDER BY rating DESC
            """)
            for row in cursor.fetchall():
                review_analytics.append({"rating": int(row["rating"]), "count": int(row["count"])})

            monthly_revenue_chart = []
            cursor.execute("""
                SELECT DATE_FORMAT(pay.created_at, '%b') AS month_label,
                       COALESCE(SUM(pay.amount), 0) AS revenue,
                       COUNT(DISTINCT b.id) AS bookings
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                WHERE pay.status = 'Success'
                GROUP BY DATE_FORMAT(pay.created_at, '%Y-%m'), month_label
                ORDER BY DATE_FORMAT(pay.created_at, '%Y-%m') ASC LIMIT 12
            """)
            for row in cursor.fetchall():
                monthly_revenue_chart.append({
                    "month": row["month_label"],
                    "revenue": float(row["revenue"]),
                    "bookings": int(row["bookings"])
                })

            stats = {
                "total_users": scalar("SELECT COUNT(*) AS count FROM Users"),
                "total_guests": scalar("SELECT COUNT(*) AS count FROM Guests"),
                "total_hosts": scalar("SELECT COUNT(*) AS count FROM Hosts"),
                "active_hosts": scalar("SELECT COUNT(*) AS count FROM Hosts WHERE is_approved = TRUE"),
                "pending_hosts": scalar("SELECT COUNT(*) AS count FROM Hosts WHERE is_approved = FALSE"),
                "total_properties": scalar("SELECT COUNT(*) AS count FROM Properties"),
                "active_properties": int(active_properties),
                "total_bookings": scalar("SELECT COUNT(*) AS count FROM Bookings"),
                "active_bookings": scalar("SELECT COUNT(*) AS count FROM Bookings WHERE status NOT IN ('Cancelled', 'Completed')"),
                "completed_bookings": int(completed_bookings),
                "cancelled_bookings": int(cancelled_bookings),
                "total_revenue": total_revenue,
                "host_revenue": host_revenue,
                "total_reviews": scalar("SELECT COUNT(*) AS count FROM Reviews"),
                "total_complaints": int(total_complaints),
                "open_complaints": int(open_complaints),
                "users_this_month": int(users_this_month),
                "hosts_this_month": int(hosts_this_month),
                "bookings_this_month": int(bookings_this_month),
                "revenue_this_month": revenue_this_month,
                "user_growth": user_growth,
                "host_growth": host_growth,
                "booking_trends": booking_trends,
                "revenue_analytics": revenue_analytics,
                "property_type_distribution": property_type_distribution,
                "booking_status_distribution": booking_status_distribution,
                "property_analytics": property_analytics,
                "occupancy_data": occupancy_data,
                "review_analytics": review_analytics,
                "monthly_revenue_chart": monthly_revenue_chart
            }

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": stats}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error loading admin stats: {str(e)}"}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Users Management
    # ──────────────────────────────────────────────
    @app.post("/api/admin/users")
    def admin_users():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.role, u.created_at, u.profile_picture,
                       CASE WHEN g.id IS NOT NULL THEN g.id ELSE NULL END AS guest_id,
                       CASE WHEN h.id IS NOT NULL THEN h.id ELSE NULL END AS host_id,
                       CASE WHEN h.is_approved IS NOT NULL THEN h.is_approved ELSE NULL END AS is_approved,
                       (SELECT COUNT(*) FROM Bookings b WHERE b.guest_id = g.id) AS bookings_count,
                       (SELECT COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_price ELSE 0 END), 0)
                        FROM Bookings b WHERE b.guest_id = g.id) AS booking_value,
                       (SELECT COUNT(*) FROM Properties p WHERE p.host_id = h.id) AS properties_count
                FROM Users u
                LEFT JOIN Guests g ON g.user_id = u.id
                LEFT JOIN Hosts h ON h.user_id = u.id
                ORDER BY u.id ASC
            """)
            users = cursor.fetchall()
            for u in users:
                u["created_at"] = str(u["created_at"])
                u["booking_value"] = float(u["booking_value"] or 0)
                u["is_approved"] = bool(u["is_approved"]) if u["is_approved"] is not None else None
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": users}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/user/delete")
    def admin_user_delete():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        user_id = body.get('user_id')
        if not user_id:
            return jsonify({"status": "error", "message": "user_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Users WHERE id = %s AND role != 'Admin'", (user_id,))
            affected = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            if affected == 0:
                return jsonify({"status": "error", "message": "User not found or cannot delete admins"}), 404
            return jsonify({"status": "success", "message": "User deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Property Delete
    # ──────────────────────────────────────────────
    @app.post("/api/admin/property/delete")
    def admin_property_delete():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        property_id = body.get('property_id')
        if not property_id:
            return jsonify({"status": "error", "message": "property_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Properties WHERE id = %s", (property_id,))
            affected = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            if affected == 0:
                return jsonify({"status": "error", "message": "Property not found"}), 404
            return jsonify({"status": "success", "message": "Property deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Payments
    # ──────────────────────────────────────────────
    @app.post("/api/admin/payments")
    def admin_payments():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT pay.id, pay.amount, pay.payment_method, pay.status, pay.transaction_id, pay.created_at,
                       b.id AS booking_id, b.check_in, b.check_out,
                       p.title AS property_title,
                       guest_user.name AS guest_name, guest_user.email AS guest_email
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                JOIN Properties p ON p.id = b.property_id
                JOIN Guests g ON g.id = b.guest_id
                JOIN Users guest_user ON guest_user.id = g.user_id
                ORDER BY pay.created_at DESC LIMIT 100
            """)
            payments = cursor.fetchall()
            for pay in payments:
                pay["amount"] = float(pay["amount"])
                pay["created_at"] = str(pay["created_at"])
                pay["check_in"] = str(pay["check_in"])
                pay["check_out"] = str(pay["check_out"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": payments}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Reviews
    # ──────────────────────────────────────────────
    @app.post("/api/admin/reviews")
    def admin_reviews():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT r.id, r.rating, r.comment, r.created_at,
                       p.title AS property_title, p.id AS property_id,
                       guest_user.name AS guest_name, guest_user.email AS guest_email
                FROM Reviews r
                JOIN Properties p ON p.id = r.property_id
                JOIN Guests g ON g.id = r.guest_id
                JOIN Users guest_user ON guest_user.id = g.user_id
                ORDER BY r.created_at DESC LIMIT 100
            """)
            reviews = cursor.fetchall()
            for rev in reviews:
                rev["created_at"] = str(rev["created_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": reviews}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/review/delete")
    def admin_review_delete():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        review_id = body.get('review_id')
        if not review_id:
            return jsonify({"status": "error", "message": "review_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Reviews WHERE id = %s", (review_id,))
            affected = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            if affected == 0:
                return jsonify({"status": "error", "message": "Review not found"}), 404
            return jsonify({"status": "success", "message": "Review deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Complaints
    # ──────────────────────────────────────────────
    @app.post("/api/admin/complaints")
    def admin_complaints():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT c.id, c.subject, c.description, c.status, c.admin_response,
                       c.created_at, c.updated_at,
                       u.name AS user_name, u.email AS user_email, u.role AS user_role
                FROM Complaints c
                JOIN Users u ON c.user_id = u.id
                ORDER BY c.created_at DESC
            """)
            complaints = cursor.fetchall()
            for comp in complaints:
                comp["created_at"] = str(comp["created_at"])
                comp["updated_at"] = str(comp["updated_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": complaints}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/complaint/update")
    def admin_complaint_update():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        complaint_id = body.get('complaint_id')
        status_val = body.get('status', '')
        admin_response = body.get('admin_response', '')
        if not complaint_id:
            return jsonify({"status": "error", "message": "complaint_id is required"}), 400
        valid_statuses = ('Open', 'In Progress', 'Resolved', 'Closed')
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id, user_id FROM Complaints WHERE id = %s", (complaint_id,))
            comp = cursor.fetchone()
            if not comp:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Complaint not found"}), 404
            updates = []
            params = []
            if status_val and status_val in valid_statuses:
                updates.append("status = %s")
                params.append(status_val)
            if admin_response:
                updates.append("admin_response = %s")
                params.append(admin_response.strip())
            if updates:
                params.append(complaint_id)
                cursor.execute(f"UPDATE Complaints SET {', '.join(updates)} WHERE id = %s", params)
                _create_notification(cursor, comp['user_id'],
                    f"Your complaint #{complaint_id} has been updated. Status: {status_val or 'unchanged'}.")
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Complaint updated"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Notifications
    # ──────────────────────────────────────────────
    @app.get("/api/admin/notifications")
    def admin_notifications():
        token = request.headers.get('X-Auth-Token', '')
        admin, error = _admin_guard({'token': token})
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, message, is_read, created_at FROM Notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
                (admin["id"],)
            )
            notifications = cursor.fetchall()
            for n in notifications:
                n["created_at"] = str(n["created_at"])
                n["is_read"] = bool(n["is_read"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": notifications}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/notifications/read")
    def admin_notifications_read():
        body = request.get_json(silent=True) or {}
        admin, error = _admin_guard(body)
        if error:
            return error
        notif_id = body.get('notification_id')
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            if notif_id:
                cursor.execute("UPDATE Notifications SET is_read = TRUE WHERE id = %s AND user_id = %s", (notif_id, admin["id"]))
            else:
                cursor.execute("UPDATE Notifications SET is_read = TRUE WHERE user_id = %s", (admin["id"],))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Notifications marked as read"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/notifications/delete")
    def admin_notifications_delete():
        body = request.get_json(silent=True) or {}
        admin, error = _admin_guard(body)
        if error:
            return error
        notif_id = body.get('notification_id')
        if not notif_id:
            return jsonify({"status": "error", "message": "notification_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Notifications WHERE id = %s AND user_id = %s", (notif_id, admin["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Notification deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Profile
    # ──────────────────────────────────────────────
    @app.get("/api/admin/profile")
    def admin_profile_get():
        token = request.headers.get('X-Auth-Token', '')
        admin, error = _admin_guard({'token': token})
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT u.id, u.name, u.email, u.profile_picture, u.created_at FROM Users u WHERE u.id = %s",
                (admin["id"],)
            )
            profile = cursor.fetchone()
            cursor.close()
            conn.close()
            if profile:
                profile["created_at"] = str(profile["created_at"])
            return jsonify({"status": "success", "data": profile}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/profile")
    def admin_profile_update():
        body = request.get_json(silent=True) or {}
        admin, error = _admin_guard(body)
        if error:
            return error
        name = body.get('name', '').strip()
        profile_picture = body.get('profile_picture', '').strip()
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            if name:
                cursor.execute("UPDATE Users SET name = %s WHERE id = %s", (name, admin["id"]))
            if profile_picture:
                cursor.execute("UPDATE Users SET profile_picture = %s WHERE id = %s", (profile_picture, admin["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Profile updated"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/admin/change_password")
    def admin_change_password():
        body = request.get_json(silent=True) or {}
        admin, error = _admin_guard(body)
        if error:
            return error
        old_password = body.get('old_password', '')
        new_password = body.get('new_password', '')
        if not old_password or not new_password:
            return jsonify({"status": "error", "message": "Both passwords are required"}), 400
        if len(new_password) < 8:
            return jsonify({"status": "error", "message": "New password must be at least 8 characters"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT password_hash, salt FROM Users WHERE id = %s", (admin["id"],))
            user = cursor.fetchone()
            old_hash = hash_password(old_password, user['salt'])
            if old_hash != user['password_hash']:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Current password is incorrect"}), 400
            new_salt = generate_salt()
            new_hash = hash_password(new_password, new_salt)
            cursor.execute("UPDATE Users SET password_hash = %s, salt = %s WHERE id = %s", (new_hash, new_salt, admin["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Password changed successfully"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Analytics
    # ──────────────────────────────────────────────
    @app.post("/api/admin/analytics")
    def admin_analytics():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            monthly_data = []
            cursor.execute("""
                SELECT DATE_FORMAT(b.created_at, '%b') AS month_label,
                       COUNT(*) AS bookings,
                       COALESCE(SUM(b.total_price), 0) AS revenue
                FROM Bookings b WHERE b.status != 'Cancelled'
                GROUP BY DATE_FORMAT(b.created_at, '%Y-%m'), month_label
                ORDER BY DATE_FORMAT(b.created_at, '%Y-%m') ASC LIMIT 12
            """)
            for row in cursor.fetchall():
                monthly_data.append({
                    "month": row["month_label"],
                    "bookings": int(row["bookings"]),
                    "revenue": float(row["revenue"])
                })

            property_type_dist = []
            cursor.execute("""
                SELECT property_type, COUNT(*) AS count FROM Properties GROUP BY property_type
            """)
            for row in cursor.fetchall():
                property_type_dist.append({"type": row["property_type"] or "Unknown", "count": int(row["count"])})

            booking_status_dist = []
            cursor.execute("""
                SELECT status, COUNT(*) AS count FROM Bookings GROUP BY status
            """)
            for row in cursor.fetchall():
                booking_status_dist.append({"status": row["status"], "count": int(row["count"])})

            top_hosts = []
            cursor.execute("""
                SELECT u.name, COUNT(DISTINCT p.id) AS properties,
                       COUNT(DISTINCT b.id) AS bookings,
                       COALESCE(SUM(CASE WHEN pay.status = 'Success' THEN pay.amount ELSE 0 END), 0) AS revenue
                FROM Users u
                JOIN Hosts h ON h.user_id = u.id
                JOIN Properties p ON p.host_id = h.id
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                WHERE h.is_approved = TRUE
                GROUP BY u.id, u.name ORDER BY revenue DESC LIMIT 10
            """)
            for row in cursor.fetchall():
                top_hosts.append({
                    "name": row["name"],
                    "properties": int(row["properties"]),
                    "bookings": int(row["bookings"]),
                    "revenue": float(row["revenue"])
                })

            top_properties = []
            cursor.execute("""
                SELECT p.title, p.address,
                       COUNT(DISTINCT b.id) AS bookings,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       COALESCE(SUM(CASE WHEN pay.status = 'Success' THEN pay.amount ELSE 0 END), 0) AS revenue
                FROM Properties p
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Reviews r ON r.property_id = p.id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                GROUP BY p.id, p.title, p.address
                ORDER BY revenue DESC LIMIT 10
            """)
            for row in cursor.fetchall():
                top_properties.append({
                    "title": row["title"],
                    "address": row["address"],
                    "bookings": int(row["bookings"]),
                    "avg_rating": round(float(row["avg_rating"] or 0), 1),
                    "revenue": float(row["revenue"])
                })

            daily_bookings = []
            cursor.execute("""
                SELECT DATE(created_at) AS day, COUNT(*) AS count
                FROM Bookings WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
                GROUP BY day ORDER BY day ASC
            """)
            for row in cursor.fetchall():
                daily_bookings.append({"date": str(row["day"]), "count": int(row["count"])})

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": {
                "monthly_data": monthly_data,
                "property_type_distribution": property_type_dist,
                "booking_status_distribution": booking_status_dist,
                "top_hosts": top_hosts,
                "top_properties": top_properties,
                "daily_bookings": daily_bookings
            }}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Reports
    # ──────────────────────────────────────────────
    @app.post("/api/admin/reports")
    def admin_reports():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            revenue_by_month = []
            cursor.execute("""
                SELECT DATE_FORMAT(pay.created_at, '%Y-%m') AS month,
                       COALESCE(SUM(pay.amount), 0) AS revenue,
                       COUNT(DISTINCT b.id) AS bookings
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                WHERE pay.status = 'Success'
                GROUP BY month ORDER BY month DESC LIMIT 12
            """)
            for row in cursor.fetchall():
                revenue_by_month.append({
                    "month": row["month"],
                    "revenue": float(row["revenue"]),
                    "bookings": int(row["bookings"])
                })

            revenue_by_property_type = []
            cursor.execute("""
                SELECT p.property_type,
                       COALESCE(SUM(pay.amount), 0) AS revenue,
                       COUNT(DISTINCT b.id) AS bookings
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                JOIN Properties p ON p.id = b.property_id
                WHERE pay.status = 'Success'
                GROUP BY p.property_type
            """)
            for row in cursor.fetchall():
                revenue_by_property_type.append({
                    "type": row["property_type"] or "Unknown",
                    "revenue": float(row["revenue"]),
                    "bookings": int(row["bookings"])
                })

            host_performance = []
            cursor.execute("""
                SELECT u.name,
                       COUNT(DISTINCT p.id) AS properties,
                       COUNT(DISTINCT b.id) AS bookings,
                       COALESCE(AVG(r.rating), 0) AS avg_rating,
                       COALESCE(SUM(CASE WHEN pay.status = 'Success' THEN pay.amount ELSE 0 END), 0) AS revenue
                FROM Users u
                JOIN Hosts h ON h.user_id = u.id AND h.is_approved = TRUE
                LEFT JOIN Properties p ON p.host_id = h.id
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Reviews r ON r.property_id = p.id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                GROUP BY u.id, u.name ORDER BY revenue DESC
            """)
            for row in cursor.fetchall():
                host_performance.append({
                    "name": row["name"],
                    "properties": int(row["properties"]),
                    "bookings": int(row["bookings"]),
                    "avg_rating": round(float(row["avg_rating"] or 0), 1),
                    "revenue": float(row["revenue"])
                })

            guest_activity = []
            cursor.execute("""
                SELECT u.name, u.email,
                       COUNT(DISTINCT b.id) AS total_bookings,
                       COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_price ELSE 0 END), 0) AS total_spent,
                       COUNT(DISTINCT rv.id) AS reviews_written
                FROM Users u
                JOIN Guests g ON g.user_id = u.id
                LEFT JOIN Bookings b ON b.guest_id = g.id
                LEFT JOIN Reviews rv ON rv.guest_id = g.id
                GROUP BY u.id, u.name, u.email
                ORDER BY total_spent DESC LIMIT 20
            """)
            for row in cursor.fetchall():
                guest_activity.append({
                    "name": row["name"],
                    "email": row["email"],
                    "total_bookings": int(row["total_bookings"]),
                    "total_spent": float(row["total_spent"]),
                    "reviews_written": int(row["reviews_written"])
                })

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": {
                "revenue_by_month": revenue_by_month,
                "revenue_by_property_type": revenue_by_property_type,
                "host_performance": host_performance,
                "guest_activity": guest_activity
            }}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Booking Actions
    # ──────────────────────────────────────────────
    @app.post("/api/admin/booking/action")
    def admin_booking_action():
        body = request.get_json(silent=True) or {}
        _, error = _admin_guard(body)
        if error:
            return error
        booking_id = body.get('booking_id')
        action = body.get('action')
        valid_actions = ('confirm', 'cancel', 'checkin', 'complete')
        if not booking_id or action not in valid_actions:
            return jsonify({"status": "error", "message": "booking_id and valid action required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id, status, guest_id FROM Bookings WHERE id = %s", (booking_id,))
            booking = cursor.fetchone()
            if not booking:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Booking not found"}), 404

            status_map = {
                'confirm': 'Confirmed', 'cancel': 'Cancelled',
                'checkin': 'Checked-In', 'complete': 'Completed'
            }
            new_status = status_map[action]

            allowed_transitions = {
                'confirm': ['Pending'], 'cancel': ['Pending', 'Confirmed', 'Checked-In'],
                'checkin': ['Confirmed'], 'complete': ['Checked-In']
            }
            if booking['status'] not in allowed_transitions[action]:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": f"Cannot {action} a booking with status '{booking['status']}'"}), 400

            cursor.execute("UPDATE Bookings SET status = %s WHERE id = %s", (new_status, booking_id))

            guest_user_cursor = conn.cursor(dictionary=True)
            guest_user_cursor.execute("SELECT user_id FROM Guests WHERE id = %s", (booking['guest_id'],))
            guest_user = guest_user_cursor.fetchone()
            guest_user_cursor.close()
            if guest_user:
                _create_notification(cursor, guest_user['user_id'],
                    f"Your booking #{booking_id} status updated to: {new_status} (by Admin)")

            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": f"Booking {new_status.lower()}"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # GUEST – Profile
    # ──────────────────────────────────────────────
    @app.get("/api/guest/profile")
    def guest_profile_get():
        token = request.headers.get('X-Auth-Token', '')
        guest, error = _guest_guard({'token': token})
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT u.id, u.name, u.email, u.profile_picture, g.bio, u.created_at
                FROM Users u
                JOIN Guests g ON g.user_id = u.id
                WHERE u.id = %s
                """,
                (guest["id"],)
            )
            profile = cursor.fetchone()
            cursor.close()
            conn.close()
            if profile:
                profile["created_at"] = str(profile["created_at"])
            return jsonify({"status": "success", "data": profile}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/profile")
    def guest_profile_update():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        name = body.get('name', '').strip()
        bio = body.get('bio', '').strip()
        profile_picture = body.get('profile_picture', '').strip()
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            if name:
                cursor.execute("UPDATE Users SET name = %s WHERE id = %s", (name, guest["id"]))
            if profile_picture:
                cursor.execute("UPDATE Users SET profile_picture = %s WHERE id = %s", (profile_picture, guest["id"]))
            cursor.execute("UPDATE Guests SET bio = %s WHERE user_id = %s", (bio, guest["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Profile updated"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/change_password")
    def guest_change_password():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        old_password = body.get('old_password', '')
        new_password = body.get('new_password', '')
        if not old_password or not new_password:
            return jsonify({"status": "error", "message": "Both passwords are required"}), 400
        if len(new_password) < 8:
            return jsonify({"status": "error", "message": "New password must be at least 8 characters"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT password_hash, salt FROM Users WHERE id = %s", (guest["id"],))
            user = cursor.fetchone()
            old_hash = hash_password(old_password, user['salt'])
            if old_hash != user['password_hash']:
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "Current password is incorrect"}), 400
            new_salt = generate_salt()
            new_hash = hash_password(new_password, new_salt)
            cursor.execute("UPDATE Users SET password_hash = %s, salt = %s WHERE id = %s", (new_hash, new_salt, guest["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Password changed successfully"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # GUEST – Dashboard Stats
    # ──────────────────────────────────────────────
    @app.post("/api/guest/stats")
    def guest_stats():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            total_bookings = (lambda: (cursor.execute("SELECT COUNT(*) AS c FROM Bookings WHERE guest_id = %s", (guest['guest_id'],)) or True) and cursor.fetchone()['c'])()
            active_bookings = (lambda: (cursor.execute("SELECT COUNT(*) AS c FROM Bookings WHERE guest_id = %s AND status IN ('Pending','Confirmed','Checked-In')", (guest['guest_id'],)) or True) and cursor.fetchone()['c'])()
            completed_bookings = (lambda: (cursor.execute("SELECT COUNT(*) AS c FROM Bookings WHERE guest_id = %s AND status = 'Completed'", (guest['guest_id'],)) or True) and cursor.fetchone()['c'])()
            total_spent = float((lambda: (cursor.execute("SELECT COALESCE(SUM(pay.amount), 0) AS t FROM Payments pay JOIN Bookings b ON b.id = pay.booking_id WHERE b.guest_id = %s AND pay.status = 'Success'", (guest['guest_id'],)) or True) and cursor.fetchone()['t'])())
            wishlist_count = (lambda: (cursor.execute("SELECT COUNT(*) AS c FROM Wishlist WHERE guest_id = %s", (guest['guest_id'],)) or True) and cursor.fetchone()['c'])()
            reviews_count = (lambda: (cursor.execute("SELECT COUNT(*) AS c FROM Reviews WHERE guest_id = %s", (guest['guest_id'],)) or True) and cursor.fetchone()['c'])()
            unread_notifications = (lambda: (cursor.execute("SELECT COUNT(*) AS c FROM Notifications WHERE user_id = %s AND is_read = FALSE", (guest['id'],)) or True) and cursor.fetchone()['c'])()

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": {
                "total_bookings": int(total_bookings),
                "active_bookings": int(active_bookings),
                "completed_bookings": int(completed_bookings),
                "total_spent": total_spent,
                "wishlist_count": int(wishlist_count),
                "reviews_count": int(reviews_count),
                "unread_notifications": int(unread_notifications)
            }}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # GUEST – Wishlist
    # ──────────────────────────────────────────────
    @app.post("/api/guest/wishlist")
    def guest_wishlist():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT w.id AS wishlist_id, w.created_at,
                       p.id, p.title, p.image_url, p.property_type, p.address,
                       p.price_per_night, p.max_guests,
                       COALESCE(AVG(r.rating), 0) AS average_rating,
                       COUNT(DISTINCT r.id) AS review_count
                FROM Wishlist w
                JOIN Properties p ON p.id = w.property_id
                LEFT JOIN Reviews r ON r.property_id = p.id
                WHERE w.guest_id = %s
                GROUP BY w.id, p.id, p.title, p.image_url, p.property_type, p.address,
                         p.price_per_night, p.max_guests, w.created_at
                ORDER BY w.created_at DESC
            """, (guest['guest_id'],))
            items = cursor.fetchall()
            for item in items:
                item["price_per_night"] = float(item["price_per_night"])
                item["average_rating"] = round(float(item["average_rating"] or 0), 1)
                item["created_at"] = str(item["created_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": items}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/wishlist/add")
    def guest_wishlist_add():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        property_id = body.get('property_id')
        if not property_id:
            return jsonify({"status": "error", "message": "property_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT IGNORE INTO Wishlist (guest_id, property_id) VALUES (%s, %s)",
                (guest['guest_id'], property_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Added to wishlist"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/wishlist/remove")
    def guest_wishlist_remove():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        property_id = body.get('property_id')
        if not property_id:
            return jsonify({"status": "error", "message": "property_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Wishlist WHERE guest_id = %s AND property_id = %s",
                           (guest['guest_id'], property_id))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Removed from wishlist"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/wishlist/check")
    def guest_wishlist_check():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        property_id = body.get('property_id')
        if not property_id:
            return jsonify({"status": "error", "message": "property_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM Wishlist WHERE guest_id = %s AND property_id = %s",
                           (guest['guest_id'], property_id))
            exists = cursor.fetchone() is not None
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": {"is_wishlisted": exists}}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # GUEST – Reviews
    # ──────────────────────────────────────────────
    @app.post("/api/guest/reviews")
    def guest_reviews():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT r.id, r.rating, r.comment, r.created_at,
                       p.title AS property_title, p.id AS property_id
                FROM Reviews r
                JOIN Properties p ON p.id = r.property_id
                WHERE r.guest_id = %s
                ORDER BY r.created_at DESC
            """, (guest['guest_id'],))
            reviews = cursor.fetchall()
            for rev in reviews:
                rev["created_at"] = str(rev["created_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": reviews}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/reviews/create")
    def guest_review_create():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        property_id = body.get('property_id')
        rating = body.get('rating')
        comment = body.get('comment', '').strip()
        if not property_id or not rating:
            return jsonify({"status": "error", "message": "property_id and rating are required"}), 400
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return jsonify({"status": "error", "message": "Rating must be between 1 and 5"}), 400
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "Invalid rating"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id FROM Bookings WHERE guest_id = %s AND property_id = %s AND status IN ('Confirmed','Completed','Checked-In')",
                           (guest['guest_id'], property_id))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "You can only review properties you have booked"}), 403
            cursor.execute("SELECT id FROM Reviews WHERE guest_id = %s AND property_id = %s", (guest['guest_id'], property_id))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"status": "error", "message": "You have already reviewed this property"}), 409
            cursor.execute("INSERT INTO Reviews (property_id, guest_id, rating, comment) VALUES (%s, %s, %s, %s)",
                           (property_id, guest['guest_id'], rating, comment or None))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Review submitted"}), 201
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/reviews/delete")
    def guest_review_delete():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        review_id = body.get('review_id')
        if not review_id:
            return jsonify({"status": "error", "message": "review_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Reviews WHERE id = %s AND guest_id = %s", (review_id, guest['guest_id']))
            affected = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            if affected == 0:
                return jsonify({"status": "error", "message": "Review not found"}), 404
            return jsonify({"status": "success", "message": "Review deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # GUEST – Notifications
    # ──────────────────────────────────────────────
    @app.get("/api/guest/notifications")
    def guest_notifications():
        token = request.headers.get('X-Auth-Token', '')
        guest, error = _guest_guard({'token': token})
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, message, is_read, created_at FROM Notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
                (guest["id"],)
            )
            notifications = cursor.fetchall()
            for n in notifications:
                n["created_at"] = str(n["created_at"])
                n["is_read"] = bool(n["is_read"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": notifications}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/notifications/read")
    def guest_notifications_read():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        notif_id = body.get('notification_id')
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            if notif_id:
                cursor.execute("UPDATE Notifications SET is_read = TRUE WHERE id = %s AND user_id = %s", (notif_id, guest["id"]))
            else:
                cursor.execute("UPDATE Notifications SET is_read = TRUE WHERE user_id = %s", (guest["id"],))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Notifications marked as read"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/notifications/delete")
    def guest_notifications_delete():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        notif_id = body.get('notification_id')
        if not notif_id:
            return jsonify({"status": "error", "message": "notification_id is required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Notifications WHERE id = %s AND user_id = %s", (notif_id, guest["id"]))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Notification deleted"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # GUEST – Payments History
    # ──────────────────────────────────────────────
    @app.post("/api/guest/payments")
    def guest_payments():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT pay.id, pay.amount, pay.payment_method, pay.status, pay.transaction_id, pay.created_at,
                       b.id AS booking_id, b.check_in, b.check_out, b.total_price,
                       p.title AS property_title, p.image_url
                FROM Payments pay
                JOIN Bookings b ON b.id = pay.booking_id
                JOIN Properties p ON p.id = b.property_id
                WHERE b.guest_id = %s
                ORDER BY pay.created_at DESC
            """, (guest['guest_id'],))
            payments = cursor.fetchall()
            for pay in payments:
                pay["amount"] = float(pay["amount"])
                pay["total_price"] = float(pay["total_price"])
                pay["created_at"] = str(pay["created_at"])
                pay["check_in"] = str(pay["check_in"])
                pay["check_out"] = str(pay["check_out"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": payments}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # GUEST – Complaints
    # ──────────────────────────────────────────────
    @app.post("/api/guest/complaints")
    def guest_complaints():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, subject, description, status, admin_response, created_at, updated_at
                FROM Complaints WHERE user_id = %s ORDER BY created_at DESC
            """, (guest['id'],))
            complaints = cursor.fetchall()
            for c in complaints:
                c["created_at"] = str(c["created_at"])
                c["updated_at"] = str(c["updated_at"])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "data": complaints}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.post("/api/guest/complaint/create")
    def guest_complaint_create():
        body = request.get_json(silent=True) or {}
        guest, error = _guest_guard(body)
        if error:
            return error
        subject = body.get('subject', '').strip()
        description = body.get('description', '').strip()
        if not subject or not description:
            return jsonify({"status": "error", "message": "Subject and description are required"}), 400
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("INSERT INTO Complaints (user_id, subject, description) VALUES (%s, %s, %s)",
                           (guest['id'], subject, description))
            complaint_id = cursor.lastrowid
            try:
                cursor.execute("SELECT user_id FROM Admins LIMIT 1")
                admin_row = cursor.fetchone()
                if admin_row:
                    _create_notification(cursor, admin_row[0], f"New complaint submitted: {subject}")
                conn.commit()
            except Exception:
                pass
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Complaint submitted"}), 201
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # ──────────────────────────────────────────────
    # ADMIN – Bookings (already exists, kept as-is)
    # ──────────────────────────────────────────────

    return app


def _dt_convert(date_str):
    from datetime import datetime
    return datetime.strptime(date_str, '%Y-%m-%d').date() if isinstance(date_str, str) else date_str


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
