#!/usr/bin/env python3
import requests
import json

def test_audit_logging():
    base_url = 'http://localhost:8000'
    
    print("Testing audit logging with account names...")
    
    # Login first
    login_data = {'username': 'admin123', 'password': 'admin123'}
    response = requests.post(f'{base_url}/api/auth/login', json=login_data)
    
    if response.status_code == 200:
        token = response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        print("✅ Login successful")
        
        # Create a role to generate audit log
        role_data = {
            'name': 'test_audit_role_2',
            'display_name': 'Test Audit Role 2',
            'description': 'Testing audit logging with account names',
            'is_active': True
        }
        
        create_response = requests.post(f'{base_url}/api/roles', json=role_data, headers=headers)
        print(f"Role creation status: {create_response.status_code}")
        
        if create_response.status_code == 200:
            print("✅ Role created successfully")
        
        # Get audit logs
        logs_response = requests.get(f'{base_url}/api/logs?limit=10', headers=headers)
        if logs_response.status_code == 200:
            logs = logs_response.json()
            print(f"✅ Retrieved {len(logs)} log entries")
            print("\nRecent audit log entries:")
            print("-" * 80)
            
            for i, log in enumerate(logs[:5]):  # Show first 5 logs
                username = log.get('username', 'N/A')
                action = log.get('action', 'N/A')
                details = log.get('details', 'N/A')
                timestamp = log.get('timestamp', 'N/A')
                
                print(f"{i+1}. Action: {action}")
                print(f"   User: {username}")
                print(f"   Details: {details}")
                print(f"   Time: {timestamp}")
                print()
                
        else:
            print(f"❌ Failed to get logs: {logs_response.status_code}")
            
    else:
        print(f"❌ Login failed: {response.status_code}")

if __name__ == "__main__":
    test_audit_logging()