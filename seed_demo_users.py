import hashlib
import secrets

import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Khamlesh@1234',
    'database': 'stayspace'
}


def generate_salt(length=32):
    return secrets.token_hex(length // 2)


def hash_password(password, salt):
    return hashlib.sha256((password + salt).encode()).hexdigest()


def seed_demo_users():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        demo_users = [
            {'name': 'Admin User', 'email': 'admin@stayspace.com', 'password': 'Admin@123', 'role': 'Admin'},
            {'name': 'Priya Host', 'email': 'host@stayspace.com', 'password': 'Host@123', 'role': 'Host'},
            {'name': 'Aarav Guest', 'email': 'user@stayspace.com', 'password': 'User@123', 'role': 'Guest'}
        ]

        for user in demo_users:
            cursor.execute("SELECT id FROM Users WHERE email = %s", (user['email'],))
            existing = cursor.fetchone()

            if existing:
                user_id = existing[0]
                cursor.execute(
                    "UPDATE Users SET name = %s, role = %s WHERE id = %s",
                    (user['name'], user['role'], user_id)
                )
                print(f"Updated {user['role']} user: {user['email']}")
            else:
                salt = generate_salt()
                password_hash = hash_password(user['password'], salt)
                cursor.execute(
                    """
                    INSERT INTO Users (name, email, password_hash, salt, role, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    """,
                    (user['name'], user['email'], password_hash, salt, user['role'])
                )
                user_id = cursor.lastrowid
                print(f"Created {user['role']} user: {user['email']}")

            if user['role'] == 'Guest':
                cursor.execute(
                    "INSERT IGNORE INTO Guests (user_id, bio) VALUES (%s, %s)",
                    (user_id, 'Avid traveler exploring memorable stays across India.')
                )
            elif user['role'] == 'Host':
                cursor.execute(
                    "INSERT IGNORE INTO Hosts (user_id, is_approved, bio) VALUES (%s, TRUE, %s)",
                    (user_id, 'Hosting unique villas, havelis, and apartments across India since 2021.')
                )
            elif user['role'] == 'Admin':
                cursor.execute(
                    "INSERT IGNORE INTO Admins (user_id) VALUES (%s)",
                    (user_id,)
                )

        conn.commit()
        cursor.close()
        conn.close()

        print("\nDemo users seeded successfully!")
        return True

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    print("Seeding StaySpace demo users...")
    seed_demo_users()
