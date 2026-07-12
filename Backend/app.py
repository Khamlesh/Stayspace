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
    'host': 'localhost',
    'user': 'root',
    'password': 'Khamlesh@1234',
    'database': 'stayspace'
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
               h.id AS host_id, h.is_approved, COALESCE(h.bio, '') AS bio
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
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5000", "http://127.0.0.1:5000"],
         allow_headers=["X-Auth-Token", "Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True)
    app.config["JSON_SORT_KEYS"] = False
    
    # Seed demo users on startup
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
        return _invoke_core("auth", "register", body)

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

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            sql = """
                SELECT p.id, p.title, p.description, p.image_url, p.property_type,
                       p.address, p.price_per_night, p.max_guests, p.created_at,
                       COALESCE(AVG(r.rating), 0) AS average_rating,
                       COUNT(DISTINCT r.id) AS review_count
                FROM Properties p
                LEFT JOIN Reviews r ON r.property_id = p.id
                WHERE 1=1
            """
            params = []
            if query_param:
                sql += " AND (p.title LIKE %s OR p.address LIKE %s OR p.description LIKE %s)"
                like_q = f"%{query_param}%"
                params.extend([like_q, like_q, like_q])
            if min_price > 0:
                sql += " AND p.price_per_night >= %s"
                params.append(min_price)
            if max_price > 0 and max_price < 10000:
                sql += " AND p.price_per_night <= %s"
                params.append(max_price)
            if guests > 0:
                sql += " AND p.max_guests >= %s"
                params.append(guests)
            if property_type and property_type in ('Apartment', 'House', 'Villa'):
                sql += " AND p.property_type = %s"
                params.append(property_type)
            sql += " GROUP BY p.id ORDER BY p.id DESC"
            cursor.execute(sql, params)
            properties = cursor.fetchall()
            for prop in properties:
                prop['price_per_night'] = float(prop['price_per_night'])
                prop['average_rating'] = round(float(prop['average_rating'] or 0), 1)
                prop['review_count'] = int(prop['review_count'])
                prop['created_at'] = str(prop['created_at'])
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Search completed.", "data": properties}), 200
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

            cursor.execute(
                """
                SELECT u.name, u.email, h.bio
                FROM Hosts h
                JOIN Users u ON u.id = h.user_id
                JOIN Properties p ON p.host_id = h.id
                WHERE p.id = %s
                """,
                (property_id,)
            )
            host = cursor.fetchone()
            prop['host'] = host

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
                        GREATEST(check_in, DATE_FORMAT(CURRENT_DATE(), '%%Y-%%m-01'))
                    ) + 1), 0) AS booked_days
                    FROM Bookings
                    WHERE property_id = %s AND status != 'Cancelled'
                      AND check_in <= LAST_DAY(CURRENT_DATE())
                      AND check_out >= DATE_FORMAT(CURRENT_DATE(), '%%Y-%%m-01')
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
                    DATE_FORMAT(m.month_start, '%%b') AS month_label,
                    m.month_start,
                    COALESCE((
                        SELECT SUM(pay.amount)
                        FROM Payments pay
                        JOIN Bookings b ON b.id = pay.booking_id
                        JOIN Properties p ON p.id = b.property_id
                        WHERE p.host_id = %s AND pay.status = 'Success'
                          AND DATE_FORMAT(pay.created_at, '%%Y-%%m') = DATE_FORMAT(m.month_start, '%%Y-%%m')
                    ), 0) AS earnings,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM Bookings b
                        JOIN Properties p ON p.id = b.property_id
                        WHERE p.host_id = %s AND b.status != 'Cancelled'
                          AND DATE_FORMAT(b.created_at, '%%Y-%%m') = DATE_FORMAT(m.month_start, '%%Y-%%m')
                    ), 0) AS bookings,
                    COALESCE((
                        SELECT ROUND(AVG(
                            LEAST(100, GREATEST(0,
                                (SELECT COUNT(*) FROM Bookings bx
                                 WHERE bx.property_id = p2.id AND bx.status != 'Cancelled'
                                   AND DATE_FORMAT(bx.created_at, '%%Y-%%m') = DATE_FORMAT(m.month_start, '%%Y-%%m')
                                ) * 10
                            ))
                        ), 0)
                        FROM Properties p2 WHERE p2.host_id = %s
                    ), 0) AS occupancy
                FROM (
                    SELECT DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%%Y-%%m-01'), INTERVAL seq MONTH) AS month_start
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

    @app.post("/api/admin/stats")
    def admin_stats():
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
                       COUNT(DISTINCT p.id) AS properties,
                       COUNT(DISTINCT b.id) AS bookings,
                       COALESCE(SUM(CASE WHEN pay.status = 'Success' THEN pay.amount ELSE 0 END), 0) AS revenue
                FROM Users u
                JOIN Hosts h ON h.user_id = u.id
                LEFT JOIN Properties p ON p.host_id = h.id
                LEFT JOIN Bookings b ON b.property_id = p.id
                LEFT JOIN Payments pay ON pay.booking_id = b.id
                GROUP BY u.id, h.id, u.name, u.email, h.is_approved, h.created_at, h.bio
                ORDER BY h.id ASC
                """
            )
            hosts = cursor.fetchall()
            for host in hosts:
                host["is_approved"] = bool(host["is_approved"])
                host["revenue"] = float(host["revenue"] or 0)
                host["created_at"] = str(host["created_at"])
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
                SELECT DATE_FORMAT(pay.created_at, '%%Y-%%m') AS month,
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

    return app


def _dt_convert(date_str):
    from datetime import datetime
    return datetime.strptime(date_str, '%Y-%m-%d').date() if isinstance(date_str, str) else date_str


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
