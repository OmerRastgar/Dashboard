#!/usr/bin/env python3
import sys
sys.path.append('backend')

from auth import SECRET_KEY, ALGORITHM, verify_token, create_access_token
import requests

def test_secret_key():
    print("Testing SECRET_KEY and token verification...")
    print(f"SECRET_KEY: {SECRET_KEY}")
    print(f"ALGORITHM: {ALGORITHM}")
    
    # Create a test token
    test_data = {
        "sub": "1",  # Use string for JWT compliance
        "username": "test_user",
        "permissions": ["test.permission"]
    }
    
    print("\n1. Creating test token...")
    test_token = create_access_token(test_data)
    print(f"Test token: {test_token[:50]}...")
    
    print("\n2. Verifying test token...")
    verified_payload = verify_token(test_token, "access")
    print(f"Verified payload: {verified_payload}")
    
    if verified_payload:
        print("✓ Token verification works locally")
    else:
        print("✗ Token verification failed locally")
    
    # Now test with a real token from login
    print("\n3. Testing with real login token...")
    base_url = "http://localhost:8000"
    login_data = {
        "username": "admin123",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        if response.status_code == 200:
            login_result = response.json()
            real_token = login_result["access_token"]
            print(f"Real token: {real_token[:50]}...")
            
            print("\n4. Verifying real token locally...")
            real_verified = verify_token(real_token, "access")
            print(f"Real verified payload: {real_verified}")
            
            if real_verified:
                print("✓ Real token verification works locally")
            else:
                print("✗ Real token verification failed locally")
                
        else:
            print(f"Login failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_secret_key()