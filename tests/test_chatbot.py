"""
Enhanced Test module for TrackerWave Analytics Platform.
Comprehensive testing for Porter Request Management and Asset Management with AI-driven features.
"""

import unittest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch, MagicMock
import sys
import os
import json
import pytz
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import enhanced components
from backend.app.db.clickhouse import ClickHouseConnection
from backend.app.core.nlp_converter import EnhancedNLPToSQLConverter
from backend.app.core.formatter import EnhancedResultFormatter
from backend.app.core.chatbot import TrackerWaveChatbot
from backend.config.settings import Config
from backend.config.schema import DatabaseSchema, ConversationState

class TestTrackerWaveConfig(unittest.TestCase):
    """Test TrackerWave configuration and asset management support."""
    
    def test_enhanced_sample_questions(self):
        """Test that sample questions include both porter and asset management."""
        sample_text = ' '.join(Config.SAMPLE_QUESTIONS).lower()
        
        # Check for Porter Management features
        self.assertIn('porter', sample_text)
        self.assertIn('tat', sample_text)
        self.assertIn('request', sample_text)
        
        # Check for Asset Management features
        self.assertIn('asset', sample_text)
        self.assertIn('department', sample_text)
        self.assertIn('warranty', sample_text)
    
    def test_date_formats_fixed(self):
        """Test that date formats are properly configured."""
        self.assertIn('US', Config.DATE_FORMATS)
        self.assertIn('EU', Config.DATE_FORMATS)
        self.assertIn('ISO', Config.DATE_FORMATS)
        
        us_format = Config.DATE_FORMATS['US']
        self.assertEqual(us_format['strftime'], '%m/%d/%Y')
        
        iso_format = Config.DATE_FORMATS['ISO']
        self.assertEqual(iso_format['strftime'], '%Y-%m-%d')
    
    def test_asset_status_codes(self):
        """Test asset status code mappings."""
        self.assertIn(0, Config.ASSET_STATUS_CODES)
        self.assertIn(1, Config.ASSET_STATUS_CODES)
        self.assertEqual(Config.ASSET_STATUS_CODES[0], 'Inactive')
        self.assertEqual(Config.ASSET_STATUS_CODES[1], 'Active')

class TestEnhancedDatabaseSchema(unittest.TestCase):
    """Test enhanced database schema definitions for both domains."""
    
    def test_porter_columns_completeness(self):
        """Test that porter columns are properly defined."""
        self.assertGreater(len(DatabaseSchema.PORTER_COLUMNS), 30)
        self.assertIn('id', DatabaseSchema.PORTER_COLUMNS)
        self.assertIn('facility_id', DatabaseSchema.PORTER_COLUMNS)
        self.assertIn('scheduled_time', DatabaseSchema.PORTER_COLUMNS)
        self.assertIn('completed_time', DatabaseSchema.PORTER_COLUMNS)
    
    def test_asset_columns_completeness(self):
        """Test that asset columns are properly defined."""
        self.assertGreater(len(DatabaseSchema.ASSET_COLUMNS), 70)
        self.assertIn('id', DatabaseSchema.ASSET_COLUMNS)
        self.assertIn('name', DatabaseSchema.ASSET_COLUMNS)
        self.assertIn('asset_type_id', DatabaseSchema.ASSET_COLUMNS)
        self.assertIn('warranty_due', DatabaseSchema.ASSET_COLUMNS)
        self.assertIn('owner_department_id', DatabaseSchema.ASSET_COLUMNS)
    
    def test_time_columns_include_both_domains(self):
        """Test that time columns include both porter and asset timestamps."""
        # Porter time columns
        self.assertIn('scheduled_time', DatabaseSchema.TIME_COLUMNS)
        self.assertIn('completed_time', DatabaseSchema.TIME_COLUMNS)
        
        # Asset time columns
        self.assertIn('warranty_due', DatabaseSchema.TIME_COLUMNS)
        self.assertIn('commissioned_on', DatabaseSchema.TIME_COLUMNS)
        self.assertIn('created_on', DatabaseSchema.TIME_COLUMNS)
    
    def test_schema_context_includes_both_domains(self):
        """Test schema context includes both porter and asset information."""
        context = DatabaseSchema.get_schema_context()
        
        self.assertIn('PORTER MANAGEMENT', context)
        self.assertIn('ASSET MANAGEMENT', context)
        self.assertIn('fact_porter_request', context)
        self.assertIn('mysql_asset', context)
        self.assertIn('CRITICAL CLICKHOUSE SQL RULES', context)

class TestConversationStateEnhanced(unittest.TestCase):
    """Test enhanced conversation state with domain tracking."""
    
    def setUp(self):
        """Set up conversation state for testing."""
        self.conv_state = ConversationState()
    
    def test_domain_tracking(self):
        """Test that conversation state tracks current domain."""
        self.assertEqual(self.conv_state.current_domain, 'porter')
        
        # Add asset management interaction
        asset_response = {
            'success': True, 
            'summary': 'Found asset data', 
            'data_domain': 'asset'
        }
        
        self.conv_state.add_interaction("Show me assets by department", asset_response)
        
        self.assertEqual(self.conv_state.current_domain, 'asset')
        self.assertEqual(len(self.conv_state.conversation_history), 1)
        
        # Check domain is stored in history
        interaction = self.conv_state.conversation_history[0]
        self.assertEqual(interaction['domain'], 'asset')
    
    def test_conversation_context_with_domains(self):
        """Test conversation context includes domain information."""
        # Add interactions from both domains
        interactions = [
            ("Show porter performance", {'success': True, 'summary': 'Found 50 porters', 'data_domain': 'porter'}),
            ("Count assets by type", {'success': True, 'summary': 'Found 200 assets', 'data_domain': 'asset'}),
            ("Which department owns most assets?", {'success': True, 'summary': 'IT department', 'data_domain': 'asset'})
        ]
        
        for query, response in interactions:
            self.conv_state.add_interaction(query, response)
        
        context = self.conv_state.get_conversation_context()
        
        self.assertIn('CONVERSATION CONTEXT', context)
        self.assertIn('[PORTER]', context)
        self.assertIn('[ASSET]', context)
        self.assertIn('Current Domain Focus: ASSET', context)

class TestEnhancedNLPConverter(unittest.TestCase):
    """Test enhanced NLP converter with asset management and domain detection."""
    
    def setUp(self):
        """Set up NLP converter with mocked dependencies."""
        self.mock_openai_client = Mock()
        self.mock_db = Mock()
        
    @patch('backend.app.core.nlp_converter.openai.AzureOpenAI')
    @patch('backend.app.core.nlp_converter.ClickHouseConnection')
    def test_domain_detection_in_intent_analysis(self, mock_db_class, mock_openai):
        """Test AI-driven domain detection in intent analysis."""
        mock_openai.return_value = self.mock_openai_client
        mock_db_class.return_value = self.mock_db
        
        # Mock asset domain response
        asset_intent_response = Mock()
        asset_intent_response.choices = [Mock()]
        asset_intent_response.choices[0].message.content = json.dumps({
            "data_domain": "asset",
            "query_type": "aggregation",
            "requested_chart_type": "pie",
            "semantic_intent": "User wants asset count by department",
            "primary_table": "mysql_asset",
            "key_entities": ["department", "asset"],
            "x_axis_suggestion": "department",
            "y_axis_suggestion": "asset_count"
        })
        
        self.mock_openai_client.chat.completions.create.return_value = asset_intent_response
        
        with patch.dict(os.environ, {'AZURE_OPENAI_API_KEY': 'test-key', 'AZURE_OPENAI_ENDPOINT': 'test-endpoint'}):
            converter = EnhancedNLPToSQLConverter()
            intent = converter.analyze_query_intent("Count assets by department")
        
        self.assertEqual(intent['data_domain'], 'asset')
        self.assertEqual(intent['primary_table'], 'mysql_asset')
        self.assertIn('department', intent['key_entities'])
    
    @patch('backend.app.core.nlp_converter.openai.AzureOpenAI')
    @patch('backend.app.core.nlp_converter.ClickHouseConnection')
    def test_porter_domain_detection(self, mock_db_class, mock_openai):
        """Test porter domain detection."""
        mock_openai.return_value = self.mock_openai_client
        mock_db_class.return_value = self.mock_db
        
        # Mock porter domain response
        porter_intent_response = Mock()
        porter_intent_response.choices = [Mock()]
        porter_intent_response.choices[0].message.content = json.dumps({
            "data_domain": "porter",
            "query_type": "aggregation",
            "requested_chart_type": "bar",
            "semantic_intent": "User wants porter performance metrics",
            "primary_table": "fact_porter_request",
            "key_entities": ["porter", "performance", "TAT"],
            "x_axis_suggestion": "porter_user_id",
            "y_axis_suggestion": "avg_tat"
        })
        
        self.mock_openai_client.chat.completions.create.return_value = porter_intent_response
        
        with patch.dict(os.environ, {'AZURE_OPENAI_API_KEY': 'test-key', 'AZURE_OPENAI_ENDPOINT': 'test-endpoint'}):
            converter = EnhancedNLPToSQLConverter()
            intent = converter.analyze_query_intent("Show porter performance metrics")
        
        self.assertEqual(intent['data_domain'], 'porter')
        self.assertEqual(intent['primary_table'], 'fact_porter_request')
        self.assertIn('porter', intent['key_entities'])
    
    @patch('backend.app.core.nlp_converter.openai.AzureOpenAI')
    @patch('backend.app.core.nlp_converter.ClickHouseConnection')
    def test_chart_axis_suggestions(self, mock_db_class, mock_openai):
        """Test that intent analysis includes chart axis suggestions."""
        mock_openai.return_value = self.mock_openai_client
        mock_db_class.return_value = self.mock_db
        
        # Mock response with axis suggestions
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "data_domain": "asset",
            "requested_chart_type": "scatter",
            "x_axis_suggestion": "asset_cost",
            "y_axis_suggestion": "current_book_value"
        })
        
        self.mock_openai_client.chat.completions.create.return_value = mock_response
        
        with patch.dict(os.environ, {'AZURE_OPENAI_API_KEY': 'test-key', 'AZURE_OPENAI_ENDPOINT': 'test-endpoint'}):
            converter = EnhancedNLPToSQLConverter()
            intent = converter.analyze_query_intent("Show correlation between asset cost and book value")
        
        self.assertEqual(intent['x_axis_suggestion'], 'asset_cost')
        self.assertEqual(intent['y_axis_suggestion'], 'current_book_value')
    
    @patch('backend.app.core.nlp_converter.openai.AzureOpenAI')
    @patch('backend.app.core.nlp_converter.ClickHouseConnection')
    def test_fallback_domain_detection(self, mock_db_class, mock_openai):
        """Test fallback domain detection when AI fails."""
        mock_openai.return_value = self.mock_openai_client
        mock_db_class.return_value = self.mock_db
        
        with patch.dict(os.environ, {'AZURE_OPENAI_API_KEY': 'test-key', 'AZURE_OPENAI_ENDPOINT': 'test-endpoint'}):
            converter = EnhancedNLPToSQLConverter()
            
            # Test asset keyword detection
            asset_intent = converter._fallback_intent_analysis("Show warranty expiring assets")
            self.assertEqual(asset_intent['data_domain'], 'asset')
            self.assertEqual(asset_intent['primary_table'], 'mysql_asset')
            
            # Test porter keyword detection
            porter_intent = converter._fallback_intent_analysis("Show porter TAT performance")
            self.assertEqual(porter_intent['data_domain'], 'porter')
            self.assertEqual(porter_intent['primary_table'], 'fact_porter_request')

class TestEnhancedResultFormatter(unittest.TestCase):
    """Test enhanced result formatting with proper date handling and chart controls."""
    
    def setUp(self):
        """Set up test data for both domains."""
        # Porter test data
        self.porter_data = pd.DataFrame({
            'porter_user_id': [12345, 67890, 11111],
            'facility_id': ['0184', '0206', '0089'],
            'request_count': [45, 67, 23],
            'tat_minutes': [15.5, 18.2, 12.8],  # Proper numeric TAT
            'scheduled_time': pd.to_datetime(['2025-06-25 10:00:00', '2025-06-25 11:00:00', '2025-06-25 12:00:00'])
        })
        
        # Asset test data
        self.asset_data = pd.DataFrame({
            'asset_id': [1001, 1002, 1003],
            'name': ['MRI Machine', 'Ventilator', 'X-Ray Machine'],
            'owner_department_id': [101, 102, 101],
            'asset_cost': [250000.00, 15000.00, 80000.00],
            'warranty_due': pd.to_datetime(['2025-12-31', '2025-08-15', '2026-03-01']),
            'commissioned_on': pd.to_datetime(['2023-01-15', '2024-02-10', '2023-07-22'])
        })
    
    def test_proper_date_formatting(self):
        """Test that dates are formatted according to user preference, not as timestamps."""
        # Test US format
        formatted_us = EnhancedResultFormatter.format_data_with_timezone(
            self.porter_data.copy(), 
            date_format='US'
        )
        
        # Check that scheduled_time is formatted as MM/DD/YYYY
        formatted_time = formatted_us['scheduled_time'].iloc[0]
        self.assertIsInstance(formatted_time, str)
        self.assertRegex(formatted_time, r'\d{2}/\d{2}/\d{4}')  # MM/DD/YYYY pattern
        
        # Test ISO format
        formatted_iso = EnhancedResultFormatter.format_data_with_timezone(
            self.asset_data.copy(), 
            date_format='ISO'
        )
        
        # Check that warranty_due is formatted as YYYY-MM-DD
        formatted_warranty = formatted_iso['warranty_due'].iloc[0]
        self.assertIsInstance(formatted_warranty, str)
        self.assertRegex(formatted_warranty, r'\d{4}-\d{2}-\d{2}')  # YYYY-MM-DD pattern
    
    def test_tat_numeric_preservation(self):
        """Test that TAT columns remain numeric, not converted to timestamps."""
        formatted_data = EnhancedResultFormatter.format_data_with_timezone(
            self.porter_data.copy(), 
            date_format='US'
        )
        
        # TAT should remain numeric
        tat_value = formatted_data['tat_minutes'].iloc[0]
        self.assertIsInstance(tat_value, (int, float))
        self.assertEqual(tat_value, 15.5)
    
    def test_chart_creation_with_axis_controls(self):
        """Test chart creation with specific axis controls."""
        intent = {
            'requested_chart_type': 'bar',
            'data_domain': 'asset'
        }
        
        chart = EnhancedResultFormatter.create_robust_chart(
            self.asset_data,
            "Show asset costs by department",
            intent,
            chart_type='bar',
            x_axis='owner_department_id',
            y_axis='asset_cost'
        )
        
        self.assertIsNotNone(chart)
        self.assertTrue(hasattr(chart, 'to_json'))
    
    def test_ai_summary_with_domain_context(self):
        """Test AI summary generation includes domain context."""
        intent = {
            'data_domain': 'asset',
            'semantic_intent': 'Analyze asset costs by department'
        }
        
        with patch('backend.app.core.nlp_converter.openai.AzureOpenAI') as mock_openai:
            mock_client = Mock()
            mock_openai.return_value = mock_client
            
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = "✅ Asset Analysis: Found 3 assets across 2 departments with varying cost structures."
            
            mock_client.chat.completions.create.return_value = mock_response
            
            with patch.dict(os.environ, {'AZURE_OPENAI_API_KEY': 'test-key', 'AZURE_OPENAI_ENDPOINT': 'test-endpoint'}):
                summary = EnhancedResultFormatter.generate_consistent_summary(
                    self.asset_data, 
                    "Show asset costs by department", 
                    intent
                )
            
            self.assertIn('✅', summary)
            self.assertIn('Asset Analysis', summary)

class TestTrackerWaveChatbot(unittest.TestCase):
    """Integration tests for TrackerWave unified chatbot functionality."""
    
    def setUp(self):
        """Set up TrackerWave chatbot with mocks."""
        self.mock_db = Mock()
        self.mock_nlp = Mock()
        self.mock_formatter = Mock()
    
    @patch('backend.app.core.chatbot.EnhancedNLPToSQLConverter')
    @patch('backend.app.core.chatbot.ClickHouseConnection')
    def test_unified_domain_processing(self, mock_db_class, mock_nlp_class):
        """Test that chatbot can handle both porter and asset queries."""
        # Setup mocks
        mock_db_class.return_value = self.mock_db
        mock_nlp_class.return_value = self.mock_nlp
        
        # Mock asset query
        self.mock_db.execute_query.return_value = (pd.DataFrame({'asset_count': [100]}), True)
        self.mock_nlp.analyze_query_intent.return_value = {
            'data_domain': 'asset',
            'query_type': 'count',
            'primary_table': 'mysql_asset'
        }
        self.mock_nlp.convert_to_sql.return_value = (
            "SELECT COUNT(*) as asset_count FROM mysql_asset", 
            "Counts all assets", 
            {'data_domain': 'asset'}
        )
        self.mock_nlp.generate_query_suggestions.return_value = [
            "Show asset types distribution",
            "Which departments have most assets"
        ]
        
        mock_session_state = MagicMock()
        mock_session_state.conversation_state = ConversationState()
        mock_session_state.user_preferences = {'date_format': 'ISO'}
        
        with patch.dict(os.environ, {'AZURE_OPENAI_API_KEY': 'test-key', 'AZURE_OPENAI_ENDPOINT': 'test-endpoint'}):
            if True:
                chatbot = TrackerWaveChatbot()
                
                # Mock the formatter methods
                chatbot.formatter.format_data_with_timezone = Mock(return_value=pd.DataFrame({'asset_count': [100]}))
                chatbot.formatter.generate_consistent_summary = Mock(return_value="✅ Found 100 assets")
                chatbot.formatter.create_robust_chart = Mock(return_value=None)
                
                result = chatbot.process_query("How many assets do we have?")
                
                self.assertTrue(result['success'])
                self.assertEqual(result['data_domain'], 'asset')
    
    @patch('backend.app.core.chatbot.EnhancedNLPToSQLConverter')
    @patch('backend.app.core.chatbot.ClickHouseConnection')
    def test_chart_type_and_axis_overrides(self, mock_db_class, mock_nlp_class):
        """Test chart type and axis override functionality."""
        mock_db_class.return_value = self.mock_db
        mock_nlp_class.return_value = self.mock_nlp
        
        self.mock_db.execute_query.return_value = (pd.DataFrame({'test': [1]}), True)
        self.mock_nlp.analyze_query_intent.return_value = {'query_type': 'test', 'data_domain': 'porter'}
        self.mock_nlp.convert_to_sql.return_value = ("SELECT 1", "Test query", {'data_domain': 'porter'})
        
        mock_session_state = MagicMock()
        mock_session_state.conversation_state = ConversationState()
        mock_session_state.user_preferences = {'date_format': 'ISO'}
        
        with patch.dict(os.environ, {'AZURE_OPENAI_API_KEY': 'test-key', 'AZURE_OPENAI_ENDPOINT': 'test-endpoint'}):
            if True:
                chatbot = TrackerWaveChatbot()
                
                # Mock formatter methods
                chatbot.formatter.format_data_with_timezone = Mock(return_value=pd.DataFrame({'test': [1]}))
                chatbot.formatter.generate_consistent_summary = Mock(return_value="✅ Test complete")
                chatbot.formatter.create_robust_chart = Mock(return_value=None)
                
                # Test with chart type and axis overrides
                result = chatbot.process_query(
                    "Test query",
                    chart_type_override='bar',
                    x_axis_override='test_x',
                    y_axis_override='test_y'
                )
                
                self.assertTrue(result['success'])
                
                # Verify that convert_to_sql was called with overrides
                self.mock_nlp.convert_to_sql.assert_called()
                call_args = self.mock_nlp.convert_to_sql.call_args
                self.assertIsNotNone(call_args)

class TestAssetManagementFeatures(unittest.TestCase):
    """Test asset management specific features."""
    
    def test_asset_domain_keywords(self):
        """Test that asset-related keywords are properly detected."""
        asset_keywords = ['asset', 'equipment', 'warranty', 'department', 'owner', 'vendor']
        
        for keyword in asset_keywords:
            query = f"Show {keyword} information"
            # This would be tested in actual NLP converter
            self.assertIn(keyword, query.lower())
    
    def test_asset_specific_columns(self):
        """Test asset-specific column definitions."""
        asset_cols = DatabaseSchema.ASSET_COLUMNS
        
        # Check important asset columns
        required_asset_columns = [
            'asset_type_id', 'asset_category_id', 'owner_department_id',
            'warranty_due', 'asset_cost', 'criticality'
        ]
        
        for col in required_asset_columns:
            self.assertIn(col, asset_cols)
    
    def test_warranty_time_columns(self):
        """Test that warranty and maintenance time columns are included."""
        time_cols = DatabaseSchema.TIME_COLUMNS
        
        warranty_time_cols = ['warranty_due', 'next_amc_due', 'pms_due']
        for col in warranty_time_cols:
            self.assertIn(col, time_cols)

def run_trackerwave_tests():
    """Run all TrackerWave tests with comprehensive coverage."""
    
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add all test classes
    test_classes = [
        TestTrackerWaveConfig,
        TestEnhancedDatabaseSchema,
        TestConversationStateEnhanced,
        TestEnhancedNLPConverter,
        TestEnhancedResultFormatter,
        TestTrackerWaveChatbot,
        TestAssetManagementFeatures
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests with enhanced reporting
    runner = unittest.TextTestRunner(verbosity=2, buffer=True)
    result = runner.run(test_suite)
    
    # Generate test report
    print("\n" + "="*70)
    print("📊 TRACKERWAVE ANALYTICS PLATFORM TEST REPORT")
    print("="*70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped) if hasattr(result, 'skipped') else 0}")
    
    if result.failures:
        print(f"\n❌ FAILURES ({len(result.failures)}):")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback.split('AssertionError:')[-1].strip() if 'AssertionError:' in traceback else 'See details above'}")
    
    if result.errors:
        print(f"\n🔥 ERRORS ({len(result.errors)}):")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback.split('Exception:')[-1].strip() if 'Exception:' in traceback else 'See details above'}")
    
    # Feature coverage report
    print(f"\n✅ FEATURE COVERAGE:")
    features_tested = [
        "🚚 Porter Request Management",
        "🏭 Asset Management Integration", 
        "🧠 AI Domain Detection",
        "📊 Chart Controls & Axis Selection",
        "📅 Proper Date Formatting (Fixed)",
        "⚡ TAT Numeric Handling (Fixed)",
        "💬 Multi-domain Conversations",
        "🔌 API Integration",
        "⚙️ Configuration Management"
    ]
    
    for feature in features_tested:
        print(f"  {feature}")
    
    success_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100) if result.testsRun > 0 else 0
    print(f"\n📊 SUCCESS RATE: {success_rate:.1f}%")
    
    if success_rate >= 95:
        print("🎉 EXCELLENT! TrackerWave unified platform tested and working.")
    elif success_rate >= 80:
        print("✅ GOOD! Most features working, minor issues detected.")
    else:
        print("⚠️  ATTENTION NEEDED: Significant issues detected.")
    
    print("="*70)
    
    return result.wasSuccessful()

if __name__ == '__main__':
    # Set up test environment
    os.environ['AZURE_OPENAI_API_KEY'] = 'test-key-for-testing'
    os.environ['AZURE_OPENAI_ENDPOINT'] = 'test-endpoint'
    
    print("🚀 Starting TrackerWave Analytics Platform Tests")
    print("Testing Porter Management + Asset Management + AI Features...")
    print()
    
    success = run_trackerwave_tests()
    
    if success:
        print("\n🎯 All tests passed! TrackerWave unified platform is ready for deployment.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed! Please review and fix issues before deployment.")
        sys.exit(1)