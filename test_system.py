#!/usr/bin/env python3
"""
Comprehensive test script for SafeDetect Blind Spot Detection System
Tests all components and provides a summary of system status
"""

import asyncio
import subprocess
import time
import json
import websockets
import sys
import os
from pathlib import Path

class SafeDetectTester:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_path = self.project_root / "backend"
        self.mobile_path = self.project_root / "mobile"
        self.test_results = {}
        
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}")
        
    def print_result(self, test_name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        self.test_results[test_name] = success
        
    def test_python_environment(self):
        """Test Python environment and dependencies"""
        self.print_header("Testing Python Environment")
        
        try:
            # Check Python version
            result = subprocess.run([sys.executable, "--version"], 
                                  capture_output=True, text=True, cwd=self.backend_path)
            if result.returncode == 0:
                self.print_result("Python Version", True, result.stdout.strip())
            else:
                self.print_result("Python Version", False, "Could not get Python version")
                return False
                
            # Check virtual environment
            venv_path = self.backend_path / "venv"
            if venv_path.exists():
                self.print_result("Virtual Environment", True, "Virtual environment exists")
            else:
                self.print_result("Virtual Environment", False, "Virtual environment not found")
                return False
                
            # Test imports
            test_imports = [
                ("OpenCV", "import cv2"),
                ("NumPy", "import numpy"),
                ("PyGame", "import pygame"),
                ("Ultralytics", "from ultralytics import YOLO"),
                ("WebSockets", "import websockets"),
            ]
            
            for name, import_cmd in test_imports:
                try:
                    result = subprocess.run([
                        sys.executable, "-c", import_cmd
                    ], capture_output=True, text=True, cwd=self.backend_path)
                    
                    if result.returncode == 0:
                        self.print_result(f"Import {name}", True)
                    else:
                        self.print_result(f"Import {name}", False, result.stderr)
                except Exception as e:
                    self.print_result(f"Import {name}", False, str(e))
                    
            return True
            
        except Exception as e:
            self.print_result("Python Environment", False, str(e))
            return False
            
    def test_video_file(self):
        """Test if test video exists"""
        self.print_header("Testing Video File")
        
        video_path = self.backend_path / "test_MJPG.avi"
        if video_path.exists():
            file_size = video_path.stat().st_size
            self.print_result("Test Video File", True, f"Size: {file_size / 1024:.1f} KB")
            return True
        else:
            self.print_result("Test Video File", False, "test_MJPG.avi not found")
            return False
            
    async def test_websocket_server(self):
        """Test WebSocket server functionality"""
        self.print_header("Testing WebSocket Server")
        
        try:
            # Start WebSocket server
            server_process = subprocess.Popen([
                sys.executable, "computer_vision/websocket_server.py"
            ], cwd=self.backend_path, env={**os.environ, "PYTHONPATH": str(self.project_root)})
            
            # Wait for server to start
            await asyncio.sleep(2)
            
            # Test connection
            try:
                uri = "ws://localhost:8765"
                async with websockets.connect(uri) as websocket:
                    # Wait for welcome message
                    welcome_response = await websocket.recv()
                    welcome_data = json.loads(welcome_response)
                    
                    if welcome_data.get("type") == "connection":
                        self.print_result("WebSocket Welcome", True, "Server sends welcome message")
                    else:
                        self.print_result("WebSocket Welcome", False, "No welcome message")
                        
                    # Send ping
                    await websocket.send(json.dumps({"type": "ping"}))
                    ping_response = await websocket.recv()
                    ping_data = json.loads(ping_response)
                    
                    if ping_data.get("type") == "pong":
                        self.print_result("WebSocket Ping/Pong", True, "Server responds to ping")
                    else:
                        self.print_result("WebSocket Ping/Pong", False, "Unexpected ping response")
                        
            except Exception as e:
                self.print_result("WebSocket Connection", False, str(e))
                
            # Stop server
            server_process.terminate()
            server_process.wait()
            
            return True
            
        except Exception as e:
            self.print_result("WebSocket Server", False, str(e))
            return False
            
    def test_mobile_dependencies(self):
        """Test mobile app dependencies"""
        self.print_header("Testing Mobile App Dependencies")
        
        try:
            # Check Node.js
            result = subprocess.run(["node", "--version"], 
                                  capture_output=True, text=True, cwd=self.mobile_path)
            if result.returncode == 0:
                self.print_result("Node.js", True, result.stdout.strip())
            else:
                self.print_result("Node.js", False, "Node.js not found")
                return False
                
            # Check npm
            result = subprocess.run(["npm", "--version"], 
                                  capture_output=True, text=True, cwd=self.mobile_path)
            if result.returncode == 0:
                self.print_result("npm", True, result.stdout.strip())
            else:
                self.print_result("npm", False, "npm not found")
                return False
                
            # Check if node_modules exists
            node_modules = self.mobile_path / "node_modules"
            if node_modules.exists():
                self.print_result("Mobile Dependencies", True, "node_modules exists")
            else:
                self.print_result("Mobile Dependencies", False, "node_modules not found")
                return False
                
            return True
            
        except Exception as e:
            self.print_result("Mobile Dependencies", False, str(e))
            return False
            
    def test_detection_system(self):
        """Test YOLOv8 detection system"""
        self.print_header("Testing Detection System")
        
        try:
            # Test detection script syntax
            result = subprocess.run([
                sys.executable, "-m", "py_compile", "computer_vision/detection.py"
            ], capture_output=True, text=True, cwd=self.backend_path)
            
            if result.returncode == 0:
                self.print_result("Detection Script Syntax", True)
            else:
                self.print_result("Detection Script Syntax", False, result.stderr)
                return False
                
            # Test YOLOv8 model loading (quick test)
            test_script = """
import sys
sys.path.append('/Users/aymanallouch/Desktop/SafeDetect')
from ultralytics import YOLO
try:
    model = YOLO('yolov8n.pt')
    print('YOLOv8 model loaded successfully')
except Exception as e:
    print(f'Error loading YOLOv8 model: {e}')
    sys.exit(1)
"""
            
            result = subprocess.run([
                sys.executable, "-c", test_script
            ], capture_output=True, text=True, cwd=self.backend_path, 
            env={**os.environ, "PYTHONPATH": str(self.project_root)})
            
            if "YOLOv8 model loaded successfully" in result.stdout:
                self.print_result("YOLOv8 Model Loading", True)
            else:
                self.print_result("YOLOv8 Model Loading", False, result.stderr)
                
            return True
            
        except Exception as e:
            self.print_result("Detection System", False, str(e))
            return False
            
    def print_summary(self):
        """Print test summary"""
        self.print_header("Test Summary")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for success in self.test_results.values() if success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests == 0:
            print("\n🎉 All tests passed! SafeDetect system is ready to use.")
            print("\nNext steps:")
            print("1. Start the backend: cd backend && source venv/bin/activate && PYTHONPATH=/Users/aymanallouch/Desktop/SafeDetect python computer_vision/blind_spot.py")
            print("2. Start the mobile app: cd mobile && npm start")
            print("3. Connect mobile app to backend via WebSocket")
        else:
            print(f"\n⚠️  {failed_tests} test(s) failed. Please fix the issues before using the system.")
            
    async def run_all_tests(self):
        """Run all tests"""
        print("SafeDetect Blind Spot Detection System - Comprehensive Test Suite")
        print("Testing all components and dependencies...")
        
        # Run tests
        self.test_python_environment()
        self.test_video_file()
        await self.test_websocket_server()
        self.test_mobile_dependencies()
        self.test_detection_system()
        
        # Print summary
        self.print_summary()

async def main():
    tester = SafeDetectTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
