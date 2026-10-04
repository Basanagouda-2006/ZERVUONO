import uuid

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_login_demo_admin(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@zervuno.com", "password": "Password123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@zervuno.com"
    assert data["user"]["role"] == "Admin"

def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@zervuno.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_register_new_user(client):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "SecurePassword123!",
            "full_name": "Test Engineer",
            "organization_name": "Test Operations Co"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["role"] == "Admin"

def test_register_all_roles(client):
    for role in ["Technician", "Manager", "Customer"]:
        email = f"user_{role.lower()}_{uuid.uuid4().hex[:6]}@example.com"
        res = client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "SecurePassword123!",
                "full_name": f"Test {role}",
                "organization_name": "Test Operations Co",
                "role": role
            }
        )
        assert res.status_code == 200, f"Registration failed for {role}: {res.text}"
        user_data = res.json()["user"]
        assert user_data["role"] == role
        assert user_data["email"] == email

        # Verify they can log in
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "SecurePassword123!"}
        )
        assert login_res.status_code == 200
        assert login_res.json()["user"]["role"] == role

def test_get_current_user_unauthenticated(client):
    """Calling /auth/me without a token or session must return HTTP 401 Unauthorized."""
    client.cookies.clear()
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert "Authentication required" in res.json().get("detail", "")

def test_get_current_user_authenticated(client):
    """Calling /auth/me with a valid Bearer token returns the user details."""
    unique_email = f"auth_me_{uuid.uuid4().hex[:6]}@example.com"
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "SecurePassword123!",
            "full_name": "Me Tester",
            "organization_name": "Me Testing Org",
            "role": "Manager"
        }
    )
    token = reg.json()["access_token"]
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == unique_email
    assert data["role"] == "Manager"

def test_logout_flow(client):
    """Calling /auth/logout with a valid token returns 200 and removes cookie."""
    unique_email = f"logout_{uuid.uuid4().hex[:6]}@example.com"
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "SecurePassword123!",
            "full_name": "Logout Tester",
            "role": "Customer"
        }
    )
    token = reg.json()["access_token"]
    res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "Successfully logged out" in res.json()["message"]
