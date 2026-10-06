def get_token(client, email, password="Password123!"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]

def test_full_maintenance_workflow(client):
    customer_token = get_token(client, "customer@zervuno.com")
    manager_token = get_token(client, "manager@zervuno.com")
    tech_token = get_token(client, "tech@zervuno.com")

    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # 1. Customer reports issue
    create_resp = client.post(
        "/api/v1/requests/",
        headers=cust_headers,
        json={
            "title": "Air compressor overheating in bay 3",
            "description": "Temperature gauge in yellow zone during continuous cycling.",
            "category": "Mechanical",
            "priority": "High"
        }
    )
    assert create_resp.status_code == 201
    req = create_resp.json()
    req_id = req["id"]
    assert req["status"] == "Submitted"
    assert req["request_number"].startswith("REQ-")

    # 2. Manager reviews and assigns technician
    tech_list = client.get("/api/v1/organizations/technicians", headers=mgr_headers).json()
    assert len(tech_list) > 0
    technician_id = tech_list[0]["user_id"]

    assign_resp = client.post(
        f"/api/v1/requests/{req_id}/assign",
        headers=mgr_headers,
        json={
            "technician_id": technician_id,
            "priority": "High",
            "manager_instructions": "Inspect oil separator and clean radiator fins."
        }
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["status"] == "Assigned"

    # 3. Technician accepts assignment
    accept_resp = client.post(f"/api/v1/requests/{req_id}/accept", headers=tech_headers)
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "Accepted"

    # 4. Technician starts work
    start_resp = client.post(f"/api/v1/requests/{req_id}/start", headers=tech_headers)
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "In Progress"

    # 5. Technician adds work log & materials
    log_resp = client.post(
        f"/api/v1/requests/{req_id}/work-logs",
        headers=tech_headers,
        json={
            "diagnosis": "Cooling radiator fins were blocked with dry warehouse dust.",
            "actions_taken": "Compressed air blowdown of heat exchanger and topped up synthetic lubricant.",
            "hours_spent": 1.75
        }
    )
    assert log_resp.status_code == 200

    mat_resp = client.post(
        f"/api/v1/requests/{req_id}/materials",
        headers=tech_headers,
        json={
            "item_name": "Synthetic Compressor Oil ISO 46",
            "quantity": 1.5,
            "unit": "liters",
            "cost": 32.00
        }
    )
    assert mat_resp.status_code == 200

    # 6. Technician submits completion
    comp_resp = client.post(
        f"/api/v1/requests/{req_id}/complete",
        headers=tech_headers,
        json={
            "completion_summary": "Heat exchanger blown out and oil replenished. Operating temperature steady at 78°C under full load.",
            "hours_spent": 0.5
        }
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "Awaiting Verification"

    # 7. Customer verifies and closes work order with 5-star rating
    verify_resp = client.post(
        f"/api/v1/requests/{req_id}/verify",
        headers=cust_headers,
        json={
            "confirmed": True,
            "feedback_rating": 5,
            "feedback_comments": "Great work! Compressor is quiet and running cool."
        }
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["status"] == "Closed"
    assert verify_resp.json()["closed_at"] is not None

def test_reopen_workflow(client):
    customer_token = get_token(client, "customer@zervuno.com")
    manager_token = get_token(client, "manager@zervuno.com")
    tech_token = get_token(client, "tech@zervuno.com")

    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # Create request
    create_resp = client.post(
        "/api/v1/requests/",
        headers=cust_headers,
        json={"title": "Loading dock dock-plate sticky", "description": "Hydraulic ram sticking on ascent", "category": "Mechanical"}
    )
    req_id = create_resp.json()["id"]

    # Assign & fast forward to Awaiting Verification
    tech_id = client.get("/api/v1/organizations/technicians", headers=mgr_headers).json()[0]["user_id"]
    client.post(f"/api/v1/requests/{req_id}/assign", headers=mgr_headers, json={"technician_id": tech_id})
    client.post(f"/api/v1/requests/{req_id}/accept", headers=tech_headers)
    client.post(f"/api/v1/requests/{req_id}/start", headers=tech_headers)
    client.post(f"/api/v1/requests/{req_id}/complete", headers=tech_headers, json={"completion_summary": "Lubricated plate hinges."})

    # Customer rejects verification -> Reopens with reason
    reopen_resp = client.post(
        f"/api/v1/requests/{req_id}/verify",
        headers=cust_headers,
        json={
            "confirmed": False,
            "reopen_reason": "Still sticking intermittently when cold."
        }
    )
    assert reopen_resp.status_code == 200
    assert reopen_resp.json()["status"] == "Reopened"
    assert reopen_resp.json()["reopen_count"] == 1
    assert "Still sticking" in reopen_resp.json()["reopen_reason"]

def test_location_auto_creation_and_management(client):
    customer_token = get_token(client, "customer@zervuno.com")
    admin_token = get_token(client, "admin@zervuno.com")
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates a facility location directly
    admin_loc_resp = client.post(
        "/api/v1/locations/",
        headers=admin_headers,
        json={
            "name": "Assembly Line Section 4",
            "building": "Manufacturing Plant A",
            "floor": "Ground Floor",
            "room": "Bay 104"
        }
    )
    assert admin_loc_resp.status_code == 201
    created_loc = admin_loc_resp.json()
    assert created_loc["name"] == "Assembly Line Section 4"

    # 2. Customer creates a request specifying a new location_name on the fly
    req_resp = client.post(
        "/api/v1/requests/",
        headers=cust_headers,
        json={
            "title": "Conveyor roller loose",
            "description": "Bearing grinding noise heard during peak throughput",
            "category": "Mechanical",
            "location_name": "Packaging Depot North",
            "priority": "Medium"
        }
    )
    assert req_resp.status_code == 201
    req_data = req_resp.json()
    assert req_data["location"] is not None
    assert req_data["location"]["name"] == "Packaging Depot North"

    # 3. Both locations appear in the active locations list for this organization
    locations_list = client.get("/api/v1/locations/", headers=cust_headers).json()
    loc_names = [loc["name"] for loc in locations_list]
    assert "Assembly Line Section 4" in loc_names
    assert "Packaging Depot North" in loc_names

def test_public_organizations_list(client):
    resp = client.get("/api/v1/organizations/public-list")
    assert resp.status_code == 200
    orgs = resp.json()
    assert isinstance(orgs, list)
    assert len(orgs) > 0
    assert "id" in orgs[0]
    assert "name" in orgs[0]

def test_technician_claim_and_complete_workflow(client):
    customer_token = get_token(client, "customer@zervuno.com")
    tech_token = get_token(client, "tech@zervuno.com")
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # 1. Customer creates request in Submitted state
    create_resp = client.post(
        "/api/v1/requests/",
        headers=cust_headers,
        json={
            "title": "Chilled water circulation pump whistling",
            "description": "High pitched cavitation whistling under heavy cooling load",
            "category": "HVAC",
            "priority": "High"
        }
    )
    assert create_resp.status_code == 201
    req_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == "Submitted"

    # 2. Technician claims the open request directly from queue
    claim_resp = client.post(f"/api/v1/requests/{req_id}/claim", headers=tech_headers)
    assert claim_resp.status_code == 200
    claimed_req = claim_resp.json()
    assert claimed_req["status"] == "Accepted"
    assert claimed_req["assigned_technician"] is not None

    # 3. Technician starts work
    start_resp = client.post(f"/api/v1/requests/{req_id}/start", headers=tech_headers)
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "In Progress"

    # 4. Technician logs work
    log_resp = client.post(
        f"/api/v1/requests/{req_id}/work-logs",
        headers=tech_headers,
        json={
            "diagnosis": "Suction strainer partially blinded with rust scale",
            "actions_taken": "Isolated pump, cleaned basket strainer, bled air from casing.",
            "hours_spent": 1.25
        }
    )
    assert log_resp.status_code == 200

    # 5. Technician submits completion
    comp_resp = client.post(
        f"/api/v1/requests/{req_id}/complete",
        headers=tech_headers,
        json={
            "completion_summary": "Cleaned pump strainer and purged system air. Differential pressure restored to 32 PSI with silent operation.",
            "hours_spent": 0.25
        }
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "Awaiting Verification"

    # 6. Customer confirms resolution
    verify_resp = client.post(
        f"/api/v1/requests/{req_id}/verify",
        headers=cust_headers,
        json={
            "confirmed": True,
            "feedback_rating": 5,
            "feedback_comments": "Pump is running whisper quiet now, thanks!"
        }
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["status"] == "Closed"
