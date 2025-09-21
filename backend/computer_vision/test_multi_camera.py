#!/usr/bin/env python3
"""
Test script for the Multi-Camera Blind Spot Detection System
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from multi_camera_detector import MultiCameraDetector, test_multi_camera_system
from shared.config import *
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_camera_detection():
    """Test camera detection and connection"""
    logger.info("🔍 Testing camera detection...")

    detector = MultiCameraDetector()

    # Test camera connections
    camera_results = detector.start_cameras()

    # Display results
    status = detector.get_camera_status()
    logger.info("📊 Camera Detection Results:")
    logger.info("=" * 50)

    for zone, info in status.items():
        status_icon = "✅" if info['status'] == 'available' else "❌"
        logger.info(f"{status_icon} {zone.upper()}: {info['name']}")
        logger.info(f"   Camera ID: {info['camera_id']}")
        logger.info(f"   Status: {CAMERA_STATUS.get(info['status'], info['status'])}")
        logger.info(f"   Description: {info['description']}")
        logger.info("")

    # Summary
    connected = sum(1 for info in status.values() if info['status'] == 'available')
    total = len(status)

    logger.info(f"📈 Summary: {connected}/{total} cameras connected")

    if connected == 0:
        logger.warning("⚠️  No cameras detected!")
        logger.info("💡 Possible solutions:")
        logger.info("   1. Connect USB cameras to your computer")
        logger.info("   2. Check camera permissions in System Settings")
        logger.info("   3. Try running: python computer_vision/blind_spot.py (uses dummy video)")
    else:
        logger.info("✅ Camera detection test completed successfully!")

    detector.stop()
    return connected > 0


async def run_quick_test():
    """Run a quick 10-second test of the multi-camera system"""
    logger.info("🚀 Starting quick multi-camera test...")

    try:
        await test_multi_camera_system()
        logger.info("✅ Quick test completed successfully!")
    except Exception as e:
        logger.error(f"❌ Quick test failed: {e}")


def main():
    """Main test function"""
    logger.info("🎥 SafeDetect Multi-Camera System Test")
    logger.info("=" * 50)

    # Test 1: Camera Detection
    print("\n" + "="*50)
    print("TEST 1: Camera Detection")
    print("="*50)

    camera_success = asyncio.run(test_camera_detection())

    # Test 2: Quick System Test (only if cameras are available)
    if camera_success:
        print("\n" + "="*50)
        print("TEST 2: Quick System Test")
        print("="*50)

        asyncio.run(run_quick_test())
    else:
        logger.info("⏭️  Skipping system test (no cameras available)")
        logger.info("💡 Run 'python computer_vision/blind_spot.py' to test with dummy video")

    logger.info("\n" + "="*50)
    logger.info("🎯 Test Summary:")
    logger.info("   • Camera Detection: {'✅ PASS' if camera_success else '❌ FAIL'}")
    logger.info("   • Next Steps: Run 'python computer_vision/blind_spot.py' to start the full system")
    logger.info("="*50)


if __name__ == "__main__":
    main()
