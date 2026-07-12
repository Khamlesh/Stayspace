import os
import sys
import uuid

import mysql.connector

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from Backend.app import DB_CONFIG, create_app


def cleanup_test_user(email):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Users WHERE email = %s", (email,))
    conn.commit()
    cursor.close()
    conn.close()


def test_health_endpoint():
    app = create_app()
    client = app.test_client()
    response = client.get('/health')
    assert response.status_code == 200
    assert response.get_json()['status'] == 'ok'


def test_auth_register_and_login_flow():
    app = create_app()
    client = app.test_client()
    email = f"flask-{uuid.uuid4().hex[:8]}@example.com"

    try:
        register_resp = client.post('/api/auth/register', json={
            'name': 'Flask Tester',
            'email': email,
            'password': 'Flask@1234',
            'role': 'Guest'
        })
        assert register_resp.status_code == 200
        register_payload = register_resp.get_json()
        assert register_payload['status'] == 'success'

        login_resp = client.post('/api/auth/login', json={
            'email': email,
            'password': 'Flask@1234'
        })
        assert login_resp.status_code == 200
        login_payload = login_resp.get_json()
        assert login_payload['status'] == 'success'
        assert 'token' in login_payload['data']
    finally:
        cleanup_test_user(email)
