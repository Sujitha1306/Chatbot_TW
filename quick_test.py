#!/usr/bin/env python3
"""
Quick test to verify the session state fix works.
"""

import sys
import os
import logging

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Suppress logs during testing
logging.basicConfig(level=logging.ERROR)

def test_chatbot_fix():
    """Test that the chatbot works without streamlit session state."""
    print("🧪 Testing chatbot session state fix...")
    
    try:
        from main import TrackerWaveChatbot
        
        # Test in testing mode
        print("  Initializing chatbot in testing mode...")
        chatbot = TrackerWaveChatbot(testing_mode=True)
        print("  ✅ Chatbot initialized successfully")
        
        # Test a simple query
        print("  Testing query processing...")
        result = chatbot.process_query("Show porter performance", row_limit=5)
        
        if result['success']:
            print(f"  ✅ Query successful: {result['row_count']} rows")
            print(f"  ✅ Domain: {result.get('data_domain', 'unknown')}")
            return True
        else:
            print(f"  ❌ Query failed: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"  ❌ Test failed: {str(e)}")
        return False

def main():
    """Run quick test."""
    print("🚀 QUICK DEMO TEST")
    print("=" * 30)
    
    success = test_chatbot_fix()
    
    if success:
        print("\n✅ Session state fix working!")
        print("✅ Demo test should now pass")
        print("\nRun full test with: python demo_test.py")
    else:
        print("\n❌ Session state fix failed") 
        print("❌ Need more debugging")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)