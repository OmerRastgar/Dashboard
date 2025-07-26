#!/usr/bin/env python3
import requests
import json
import jwt
import base64

def debug_token():
    base_url = "http://localhost:8000"
    
    print("Debugging JWT token...")
    
    # Step 1: Login and get token
    login_data = {
        "username": "admin123",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        if response.status_code == 200:
            login_result = response.json()
            access_token = login_result["access_token"]
            print(f"Access token: {access_token}")
            
            # Decode token without verification to see its contents
            try:
                # Split the token
                parts = access_token.split('.')
                print(f"Token parts: {len(parts)}")
                
                # Decode header
                header = json.loads(base64.urlsafe_b64decode(parts[0] + '=='))
                print(f"Token header: {header}")
                
                # Decode payload
                payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))
                print(f"Token payload: {payload}")
                
                # Check if token is expired
                import time
                current_time = time.time()
                if 'exp' in payload:
                    exp_time = payload['exp']
                    print(f"Token expires at: {exp_time}")
                    print(f"Current time: {current_time}")
                    print(f"Token expired: {current_time > exp_time}")
                
            except Exception as e:
                print(f"Error decoding token: {e}")
                
        else:
            print(f"Login failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_token()