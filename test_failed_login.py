#!/usr/bin/env python3
import requests
import json
import time

def test_failed_login_logging():
    base_url = 'http://localhost:8000'
    
    print("Testing failed login logging...")
    
    # Attempt failed login
    print("\n1. Attempting failed login...")
    failed_login_data = {'username': 'admin123', 'password': 'wrongpassword'}
    failed_response = requests.post(f'{base_url}/api/auth/login', json=failed_login_data)
    
    print(f"Failed login response status: {failed_response.status_code}")
    if failed_response.status_code == 401:
        print("✅ Failed login properly rejected")
    
    # Now login successfully to get token for checking logs
    print("\n2. Logging in successfully to check logs...")
    login_data = {'username': 'admin123', 'password': 'admin123'}
    login_response = requests.post(f'{base_url}/api/auth/login', json=login_data)
    
    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Wait a moment for logging to complete
        time.sleep(1)
        
        # Get recent logs
        print("\n3. Checking audit logs for failed login attempts...")
        logs_response = requests.get(f'{base_url}/api/logs?limit=15', headers=headers)
        
        if logs_response.status_code == 200:
            logs = logs_response.json()
            
            # Look for failed login logs
            failed_login_logs = [log for log in logs if 'failed_login' in log.get('action', '')]
            print(f"Found {len(failed_login_logs)} failed login log entries:")
            
            for i, log in enumerate(failed_login_logs[:3]):
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
            
            # Look for successful login logs
            success_login_logs = [log for log in logs if 'user_login' in log.get('action', '')]
            print(f"Found {len(success_login_logs)} successful login log entries:")
            
            for i, log in enumerate(success_login_logs[:2]):
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
                
        else:
            print(f"❌ Failed to get logs: {logs_response.status_code}")
    else:
        print(f"❌ Successful login failed: {login_response.status_code}")

if __name__ == "__main__":
    test_failed_login_logging()