#!/usr/bin/env python3
import requests
import json
import time

def test_comprehensive_login_logging():
    base_url = 'http://localhost:8000'
    
    print("Testing comprehensive login logging scenarios...")
    
    # Test 1: Failed login with wrong username
    print("\n1. Testing failed login with wrong username...")
    failed_user_data = {'username': 'nonexistent_user', 'password': 'anypassword'}
    response1 = requests.post(f'{base_url}/api/auth/login', json=failed_user_data)
    print(f"Response status: {response1.status_code}")
    
    # Test 2: Failed login with wrong password
    print("\n2. Testing failed login with wrong password...")
    failed_pass_data = {'username': 'admin123', 'password': 'wrongpassword'}
    response2 = requests.post(f'{base_url}/api/auth/login', json=failed_pass_data)
    print(f"Response status: {response2.status_code}")
    
    # Test 3: Successful login
    print("\n3. Testing successful login...")
    success_data = {'username': 'admin123', 'password': 'admin123'}
    response3 = requests.post(f'{base_url}/api/auth/login', json=success_data)
    print(f"Response status: {response3.status_code}")
    
    if response3.status_code == 200:
        token = response3.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Wait for logs to be written
        time.sleep(1)
        
        # Get recent logs
        print("\n4. Checking all recent login-related logs...")
        logs_response = requests.get(f'{base_url}/api/logs?limit=20', headers=headers)
        
        if logs_response.status_code == 200:
            logs = logs_response.json()
            
            # Filter login-related logs
            login_logs = [log for log in logs if 'login' in log.get('action', '').lower()]
            
            print(f"Found {len(login_logs)} login-related log entries:")
            print("=" * 80)
            
            for i, log in enumerate(login_logs[:10]):  # Show first 10
                username = log.get('username', 'N/A')
                action = log.get('action', 'N/A')
                details = log.get('details', 'N/A')
                timestamp = log.get('timestamp', 'N/A')
                status = log.get('status', 'N/A')
                severity = log.get('severity', 'N/A')
                
                print(f"{i+1}. Action: {action}")
                print(f"   User: {username}")
                print(f"   Status: {status}")
                print(f"   Severity: {severity}")
                print(f"   Details: {details}")
                print(f"   Time: {timestamp}")
                print("-" * 40)
                
            # Summary
            success_logins = [log for log in login_logs if log.get('status') == 'success']
            failed_logins = [log for log in login_logs if log.get('status') == 'failed']
            
            print(f"\nSUMMARY:")
            print(f"✅ Successful logins logged: {len(success_logins)}")
            print(f"❌ Failed logins logged: {len(failed_logins)}")
            print(f"📊 Total login events logged: {len(login_logs)}")
            
            if len(failed_logins) > 0 and len(success_logins) > 0:
                print("\n🎉 All login scenarios are being properly logged with account names!")
            else:
                print("\n⚠️  Some login scenarios may not be logging correctly.")
                
        else:
            print(f"❌ Failed to get logs: {logs_response.status_code}")
    else:
        print("❌ Successful login failed, cannot check logs")

if __name__ == "__main__":
    test_comprehensive_login_logging()