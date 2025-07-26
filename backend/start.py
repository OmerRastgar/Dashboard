#!/usr/bin/env python3
"""
FastAPI Backend Starter Script
Run this to start the backend server
"""
import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def start_server():
    """Start the FastAPI server"""
    print("Starting FastAPI server on http://localhost:8000")
    print("Press Ctrl+C to stop the server")
    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

if __name__ == "__main__":
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    print("🚀 FastAPI Backend Setup")
    print("=" * 30)
    
    if install_requirements():
        print("\n" + "=" * 30)
        start_server()