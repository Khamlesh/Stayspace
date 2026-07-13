import mysql.connector
import random
from datetime import datetime, timedelta

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Khamlesh@1234',
    'database': 'stayspace'
}

PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking']
STATUSES = ['Completed', 'Completed', 'Completed', 'Confirmed', 'Cancelled', 'Pending', 'Checked-In']


def seed_bookings():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id, price_per_night FROM Properties ORDER BY RAND() LIMIT 15")
    properties = cursor.fetchall()
    if not properties:
        print("No properties found. Run seed_data.py first.")
        return

    cursor.execute("SELECT id FROM Guests ORDER BY RAND() LIMIT 10")
    guests = [r['id'] for r in cursor.fetchall()]
    if not guests:
        print("No guests found. Run seed_data.py first.")
        return

    now = datetime.now()
    created_count = 0

    for i, prop in enumerate(properties):
        guest_id = random.choice(guests)
        status = random.choice(STATUSES)

        days_offset = random.randint(-90, 15)
        check_in = (now + timedelta(days=days_offset)).strftime('%Y-%m-%d')
        nights = random.randint(2, 7)
        check_out = (now + timedelta(days=days_offset + nights)).strftime('%Y-%m-%d')
        total_price = float(prop['price_per_night']) * nights
        guests_count = random.randint(1, 4)

        cursor.execute(
            """INSERT INTO Bookings (property_id, guest_id, check_in, check_out, total_price, status, guests_count, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, DATE_SUB(NOW(), INTERVAL %s DAY))""",
            (prop['id'], guest_id, check_in, check_out, round(total_price, 2), status, guests_count, random.randint(1, 60))
        )
        booking_id = cursor.lastrowid

        if status in ('Completed', 'Confirmed', 'Checked-In'):
            payment_status = 'Success'
        elif status == 'Cancelled' and random.random() > 0.5:
            payment_status = 'Failed'
        else:
            payment_status = 'Success'

        txn_id = f"TXN{random.randint(10000000, 99999999)}"
        cursor.execute(
            """INSERT INTO Payments (booking_id, amount, payment_method, status, transaction_id, created_at)
               VALUES (%s, %s, %s, %s, %s, DATE_SUB(NOW(), INTERVAL %s DAY))""",
            (booking_id, round(total_price, 2), random.choice(PAYMENT_METHODS), payment_status, txn_id, random.randint(1, 60))
        )
        created_count += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Created {created_count} bookings with payments.")


if __name__ == '__main__':
    seed_bookings()
