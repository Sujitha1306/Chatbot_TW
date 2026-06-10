#!/usr/bin/env python3
"""
TrackerWave Demo Test Script - GUARANTEE all demo queries work before client meeting.
Run this script before every client demo to ensure 100% success rate.
"""

import sys
import os
import logging
from datetime import datetime
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')
os.environ['STREAMLIT_SERVER_HEADLESS'] = 'true'  # Suppress streamlit warnings

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import TrackerWaveChatbot, ClickHouseConnection
    from config import Config
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure you're running from the TrackerWave directory")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.ERROR)  # Suppress logs during testing

class DemoTester:
    """Test all demo queries to guarantee they work."""
    
    # These queries MUST work for client demos
    CRITICAL_DEMO_QUERIES = [
        "Show porter performance",
        "Show porter performance by facility", 
        "Count assets by department",
        "Show me all columns for recent porter requests",
        "Show requests from June 2025",
        "Show all asset information",
        "Display porter requests by facility"
    ]
    
    def __init__(self):
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'failures': [],
            'success_rate': 0,
            'demo_ready': False
        }
        
    def test_database_connection(self):
        """Test basic database connectivity."""
        print("🔌 Testing database connection...")
        try:
            db = ClickHouseConnection()
            result, success = db.execute_query("SELECT 1 as test")
            if success and not result.empty:
                print("✅ Database connection successful")
                return True
            else:
                print("❌ Database connection failed - no results")
                return False
        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")
            return False
    
    def test_chatbot_initialization(self):
        """Test chatbot initialization."""
        print("🤖 Testing chatbot initialization...")
        try:
            chatbot = TrackerWaveChatbot(testing_mode=True)  # Enable testing mode
            print("✅ Chatbot initialized successfully")
            return chatbot
        except Exception as e:
            print(f"❌ Chatbot initialization failed: {str(e)}")
            return None
    
    def test_schema_discovery(self, chatbot):
        """Test that we can discover database schema."""
        print("📋 Testing schema discovery...")
        try:
            schema = chatbot.nlp_converter.actual_schema
            
            porter_cols = len(schema.get('porter_columns', []))
            asset_cols = len(schema.get('asset_columns', []))
            
            if porter_cols > 0:
                print(f"✅ Porter table discovered: {porter_cols} columns")
            else:
                print("⚠️  Porter table not found or empty")
            
            if asset_cols > 0:
                print(f"✅ Asset table discovered: {asset_cols} columns")
            else:
                print("⚠️  Asset table not found or empty")
            
            return porter_cols > 0 or asset_cols > 0
            
        except Exception as e:
            print(f"❌ Schema discovery failed: {str(e)}")
            return False
    
    def test_guaranteed_queries(self, chatbot):
        """Test all guaranteed queries."""
        print("🎯 Testing guaranteed queries...")
        
        try:
            guaranteed = chatbot.nlp_converter.guaranteed_queries
            print(f"Found {len(guaranteed)} guaranteed queries")
            
            for key, query_config in guaranteed.items():
                print(f"  Testing: {key}")
                try:
                    result, success = chatbot.db.execute_query(query_config['sql'])
                    if success and not result.empty:
                        print(f"    ✅ {key}: {len(result)} rows")
                    else:
                        print(f"    ❌ {key}: No results")
                        self.results['failures'].append({
                            'query': key,
                            'sql': query_config['sql'],
                            'error': 'No results returned'
                        })
                except Exception as e:
                    print(f"    ❌ {key}: {str(e)}")
                    self.results['failures'].append({
                        'query': key,
                        'sql': query_config['sql'],
                        'error': str(e)
                    })
                    
        except Exception as e:
            print(f"❌ Guaranteed query testing failed: {str(e)}")
            return False
        
        return True
    
    def test_demo_queries(self, chatbot):
        """Test all critical demo queries end-to-end."""
        print("\n🎭 TESTING CRITICAL DEMO QUERIES")
        print("=" * 50)
        
        for query in self.CRITICAL_DEMO_QUERIES:
            self.results['total_tests'] += 1
            print(f"\n🧪 Testing: '{query}'")
            
            try:
                # Test the full query processing pipeline
                result = chatbot.process_query(query, row_limit=5)
                
                if result['success'] and result['row_count'] > 0:
                    print(f"✅ SUCCESS: {result['row_count']} rows, domain: {result.get('data_domain', 'unknown')}")
                    self.results['passed'] += 1
                else:
                    print(f"❌ FAILED: {result.get('error', 'No data returned')}")
                    self.results['failed'] += 1
                    self.results['failures'].append({
                        'query': query,
                        'error': result.get('error', 'No data returned'),
                        'sql': result.get('sql', 'No SQL generated')
                    })
                    
            except Exception as e:
                print(f"❌ FAILED: {str(e)}")
                self.results['failed'] += 1
                self.results['failures'].append({
                    'query': query,
                    'error': str(e),
                    'sql': 'Exception during processing'
                })
        
        # Calculate success rate
        if self.results['total_tests'] > 0:
            self.results['success_rate'] = (self.results['passed'] / self.results['total_tests']) * 100
            self.results['demo_ready'] = self.results['success_rate'] >= 95
    
    def run_full_test(self):
        """Run complete demo readiness test."""
        print("🚀 TRACKERWAVE DEMO READINESS TEST")
        print("=" * 60)
        print(f"📅 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Test database
        if not self.test_database_connection():
            print("\n❌ CRITICAL FAILURE: Database not accessible")
            return False
        
        # Test chatbot
        chatbot = self.test_chatbot_initialization()
        if not chatbot:
            print("\n❌ CRITICAL FAILURE: Chatbot initialization failed")
            return False
        
        # Test schema
        if not self.test_schema_discovery(chatbot):
            print("\n❌ CRITICAL FAILURE: Cannot discover database schema")
            return False
        
        # Test guaranteed queries
        self.test_guaranteed_queries(chatbot)
        
        # Test demo queries
        self.test_demo_queries(chatbot)
        
        # Print results
        self.print_results()
        
        return self.results['demo_ready']
    
    def print_results(self):
        """Print comprehensive test results."""
        print("\n" + "=" * 60)
        print("📊 DEMO READINESS RESULTS")
        print("=" * 60)
        
        print(f"📋 Total Tests: {self.results['total_tests']}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {self.results['success_rate']:.1f}%")
        
        if self.results['demo_ready']:
            print("\n🎉 DEMO READY! ✅")
            print("All critical queries working - safe for client presentation")
        else:
            print("\n⚠️  DEMO NOT READY ❌") 
            print("Fix failing queries before client meeting")
        
        # Show failures
        if self.results['failures']:
            print(f"\n❌ FAILED QUERIES ({len(self.results['failures'])}):")
            for i, failure in enumerate(self.results['failures'], 1):
                print(f"\n{i}. Query: {failure['query']}")
                print(f"   Error: {failure['error']}")
                if 'sql' in failure and failure['sql'] != 'Exception during processing':
                    print(f"   SQL: {failure['sql'][:100]}...")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if self.results['demo_ready']:
            print("✅ System ready for demo")
            print("✅ Prepare backup queries just in case")
            print("✅ Test chart generation during demo")
            print("✅ Have CLIENT_DEMO_GUIDE.md ready")
        else:
            print("🔧 Fix failing database queries")
            print("🔧 Check database schema and permissions")
            print("🔧 Verify .env configuration")
            print("🔧 Consider using simpler fallback queries")
        
        print("=" * 60)

def main():
    """Run demo test."""
    if len(sys.argv) > 1 and sys.argv[1] == '--quick':
        # Quick test mode
        print("⚡ Running quick database test...")
        tester = DemoTester()
        if tester.test_database_connection():
            print("✅ Quick test passed - database accessible")
        else:
            print("❌ Quick test failed - check database connection")
            sys.exit(1)
    else:
        # Full test mode
        tester = DemoTester()
        success = tester.run_full_test()
        
        if success:
            print("\n🎯 Ready for client demo!")
            sys.exit(0)
        else:
            print("\n🚨 NOT ready for client demo - fix issues first")
            sys.exit(1)

if __name__ == "__main__":
    main()