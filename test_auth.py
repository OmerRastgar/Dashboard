#!/usr/bin/env python3
import requests
import json

# Test authentication flow
def test_authentication():
    base_url = "http://localhost:8000"
    
    print("Testing authentication flow...")
    
    # Step 1: Login
    print("\n1. Testing login...")
    login_data = {
        "username": "admin123",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            access_token = login_result["access_token"]
            print("Login successful!")
            print(f"Access token (first 20 chars): {access_token[:20]}...")
            
            # Step 2: Test authenticated endpoint
            print("\n2. Testing authenticated endpoint...")
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Test getting roles (should require authentication)
            roles_response = requests.get(f"{base_url}/api/roles", headers=headers)
            print(f"Roles endpoint response status: {roles_response.status_code}")
            
            if roles_response.status_code == 200:
                roles = roles_response.json()
                print(f"Successfully retrieved {len(roles)} roles")
                print("Authentication is working correctly!")
            else:
                print(f"Failed to access roles endpoint: {roles_response.text}")
                
            # Step 3: Test creating a role (should require authentication)
            print("\n3. Testing role creation...")
            new_role_data = {
                "name": "test_role_auth",
                "display_name": "Test Role for Auth",
                "description": "Testing authentication",
                "is_active": True
            }
            
            create_response = requests.post(f"{base_url}/api/roles", json=new_role_data, headers=headers)
            print(f"Create role response status: {create_response.status_code}")
            print(f"Create role response headers: {dict(create_response.headers)}")
            
            if create_response.status_code == 200:
                print("Role creation successful! Authentication is working.")
            else:
                print(f"Role creation failed: {create_response.text}")
                
            # Step 4: Test token verification directly
            print("\n4. Testing token verification...")
            print(f"Using Authorization header: {headers['Authorization'][:50]}...")
            me_response = requests.get(f"{base_url}/api/auth/me", headers=headers)
            print(f"Me endpoint response status: {me_response.status_code}")
            if me_response.status_code == 200:
                print("Token verification successful!")
                print(f"User data: {me_response.json()}")
            else:
                print(f"Token verification failed: {me_response.text}")
                
            # Step 5: Test with a simple authenticated endpoint
            print("\n5. Testing simple authenticated endpoint...")
            simple_headers = {"Authorization": f"Bearer {access_token}"}
            test_response = requests.get(f"{base_url}/api/auth/me", headers=simple_headers)
            print(f"Simple test response status: {test_response.status_code}")
            if test_response.status_code != 200:
                print(f"Simple test failed: {test_response.text}")
                
        else:
            print(f"Login failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend. Make sure it's running on port 8000.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_authentication()