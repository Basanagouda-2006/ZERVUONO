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
