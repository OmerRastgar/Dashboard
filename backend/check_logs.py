import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={os.getenv('DB_SERVER')};DATABASE={os.getenv('DB_NAME')};UID={os.getenv('DB_USER')};PWD={os.getenv('DB_PASSWORD')}"
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Check if there are any logs
cursor.execute('SELECT COUNT(*) FROM audit2_logs')
count = cursor.fetchone()[0]
print(f'Total logs in database: {count}')

# Get a few sample logs
cursor.execute('SELECT TOP 5 id, action, username, timestamp, severity FROM audit2_logs ORDER BY timestamp DESC')
logs = cursor.fetchall()
print('\nSample logs:')
for log in logs:
    print(f'ID: {log[0]}, Action: {log[1]}, User: {log[2]}, Time: {log[3]}, Severity: {log[4]}')

conn.close()