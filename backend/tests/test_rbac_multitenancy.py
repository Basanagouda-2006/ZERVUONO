def get_token(client, email, password="Password123!"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]

def test_customer_cannot_assign_technician(client):
    customer_token = get_token(client, "customer@zervuno.com")
    headers = {"Authorization": f"Bearer {customer_token}"}

    resp = client.post(
        "/api/v1/requests/some-fake-id/assign",
        headers=headers,
        json={"technician_id": "any-id"}
    )
    # Role forbidden
    assert resp.status_code == 403
    assert "Access denied" in resp.json()["detail"]

def test_customer_only_sees_their_own_requests(client):
    customer_token = get_token(client, "customer@zervuno.com")
    headers = {"Authorization": f"Bearer {customer_token}"}

    resp = client.get("/api/v1/requests/", headers=headers)
    assert resp.status_code == 200
    requests = resp.json()
    # Every request must be owned by the customer
    customer_info = client.get("/api/v1/auth/me", headers=headers).json()
    for req in requests:
        assert req["requester_id"] == customer_info["id"]

def test_operational_report_requires_manager_or_admin(client):
    customer_token = get_token(client, "customer@zervuno.com")
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    resp = client.get("/api/v1/reports/summary", headers=cust_headers)
    assert resp.status_code == 403

    manager_token = get_token(client, "manager@zervuno.com")
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}
    mgr_resp = client.get("/api/v1/reports/summary", headers=mgr_headers)
    assert mgr_resp.status_code == 200
    report = mgr_resp.json()
    assert "total_requests" in report
    assert "open_requests" in report
    assert "technicians_workload" in report
