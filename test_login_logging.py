#!/usr/bin/env python3
import requests
import json
import time

def test_login_logging():
    base_url = 'http://localhost:8000'
    
    print("Testing login logging...")
    
    # First, get current logs count
    print("\n1. Getting initial logs...")
    try:
        # Try to get logs without authentication first (might fail)
        initial_response = requests.get(f'{base_url}/api/logs?limit=5')
        if initial_response.status_code == 200:
            initial_logs = initial_response.json()
            print(f"Initial logs count: {len(initial_logs)}")
        else:
            print("Cannot get initial logs without authentication")
    except:
        print("Cannot get initial logs")
    
    # Perform login
    print("\n2. Performing login...")
    login_data = {'username': 'admin123', 'password': 'admin123'}
    login_response = requests.post(f'{base_url}/api/auth/login', json=login_data)
    
    if login_response.status_code == 200:
        print("✅ Login successful")
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Wait a moment for logging to complete
        time.sleep(1)
        
        # Get logs after login
        print("\n3. Getting logs after login...")
        logs_response = requests.get(f'{base_url}/api/logs?limit=10', headers=headers)
        
        if logs_response.status_code == 200:
            logs = logs_response.json()
            print(f"✅ Retrieved {len(logs)} log entries after login")
            
            # Look for login-related logs
            login_logs = [log for log in logs if 'login' in log.get('action', '').lower()]
            print(f"\nFound {len(login_logs)} login-related log entries:")
            
            for i, log in enumerate(login_logs[:3]):
                username = log.get('username', 'N/A')
                action = log.get('action', 'N/A')
                details = log.get('details', 'N/A')
                timestamp = log.get('timestamp', 'N/A')
                status = log.get('status', 'N/A')
                
                print(f"{i+1}. Action: {action}")
                print(f"   User: {username}")
                print(f"   Status: {status}")
                print(f"   Details: {details}")
                print(f"   Time: {timestamp}")
                print()
            
            if len(login_logs) == 0:
                print("❌ No login logs found! This indicates a logging issue.")
                print("\nAll recent logs:")
                for i, log in enumerate(logs[:5]):
                    print(f"{i+1}. {log.get('action')} by {log.get('username')} - {log.get('details')}")
        else:
            print(f"❌ Failed to get logs: {logs_response.status_code}")
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")

if __name__ == "__main__":
    test_login_logging()