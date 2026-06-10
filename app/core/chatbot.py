import logging
import streamlit as st
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from config.settings import Config
from config.schema import ConversationState
from app.db.clickhouse import ClickHouseConnection
from app.core.nlp_converter import EnhancedNLPToSQLConverter
from app.core.formatter import EnhancedResultFormatter
from app.core.cache import get_cached_result, set_cached_result, restore_chart_from_cache

logger = logging.getLogger(__name__)

class TrackerWaveChatbot:
    """TrackerWave unified analytics chatbot with improved reliability."""
    
    def __init__(self, testing_mode=False):
        self.db = ClickHouseConnection()
        self.testing_mode = testing_mode
        
        try:
            self.nlp_converter = EnhancedNLPToSQLConverter()
        except ValueError as e:
            logger.error(f"Failed to initialize NLP converter: {str(e)}")
            if not testing_mode:
                st.error(f"Configuration error: {str(e)}")
                st.stop()
            else:
                raise
        
        self.formatter = EnhancedResultFormatter()
        
        # Initialize session state (with fallback for testing)
        if testing_mode:
            # Create mock session state for testing
            self.conversation_state = ConversationState()
            self.user_preferences = {
                'date_format': 'ISO',
                'timezone': 'Asia/Kolkata'
            }
        else:
            # Initialize enhanced session state for Streamlit
            if 'conversation_state' not in st.session_state:
                st.session_state.conversation_state = ConversationState()
            
            if 'user_preferences' not in st.session_state:
                # Auto-detect timezone from browser
                detected_timezone = self._detect_user_timezone()
                st.session_state.user_preferences = {
                    'date_format': 'ISO',
                    'timezone': detected_timezone
                }
    
    def _detect_user_timezone(self) -> str:
        """Detect user's timezone automatically."""
        try:
            # For this demo, detect based on common patterns
            # In production, this would use JavaScript
            return 'Asia/Kolkata'
        except Exception:
            return 'UTC'
    
    def _get_session_state(self):
        """Get session state (real or mock for testing)."""
        if self.testing_mode:
            return type('MockSessionState', (), {
                'conversation_state': self.conversation_state,
                'user_preferences': self.user_preferences
            })()
        else:
            return st.session_state
    
    def process_query(self, user_question: str, row_limit: int = None, 
                     chart_type_override: str = None, x_axis_override: str = None, 
                     y_axis_override: str = None, use_demo_backup: bool = False) -> Dict[str, Any]:
        """Enhanced query processing with demo backup support."""
        
        try:
            # Get session state (real or mock)
            session_state = self._get_session_state()
            
            # If demo backup requested, use it immediately
            if use_demo_backup:
                try:
                    from client_demo_backup import DemoBackup
                    backup_result = DemoBackup.get_backup_response(user_question)
                    
                    return {
                        'success': True,
                        'summary': backup_result['summary'],
                        'data': backup_result['data'],
                        'chart': backup_result['chart'],
                        'explanation': "Demo backup data - pre-prepared for presentation",
                        'sql': "-- Demo backup query (hardcoded data)",
                        'row_count': backup_result['row_count'],
                        'intent': {'data_domain': backup_result['domain']},
                        'data_domain': backup_result['domain'],
                        'timezone_used': 'Asia/Kolkata',
                        'suggestions': [
                            "Show porter performance by facility",
                            "Count assets by department",
                            "Show asset distribution by department as pie chart"
                        ],
                        'is_demo_backup': True
                    }
                except Exception as backup_error:
                    logger.error(f"Demo backup failed: {str(backup_error)}")
                    # Continue with normal processing
            
            # [0.5] Cache lookup — try to serve from cache before any LLM/DB calls
            # We need a domain guess for cache lookup before running intent analysis.
            _domain_hint = "asset" if any(w in user_question.lower() for w in [
                "asset", "equipment", "warranty", "maintenance", "amc", "pms"
            ]) else "porter"

            cached = get_cached_result(
                question=user_question,
                domain=_domain_hint,
                row_limit=row_limit,
                chart_type=chart_type_override,
            )
            if cached is not None:
                cached = restore_chart_from_cache(cached)
                cached["from_cache"] = True
                return cached
            
            # Get conversation context
            conversation_context = session_state.conversation_state.get_conversation_context()
            
            # Analyze intent
            intent_analysis = self.nlp_converter.analyze_query_intent(user_question, conversation_context)

            # Use detected timezone
            user_timezone = session_state.user_preferences.get('timezone', 'Asia/Kolkata')
            
            # Convert to SQL with GUARANTEED queries
            sql_query, explanation, intent = self.nlp_converter.convert_to_sql(
                user_question,
                user_timezone,
                conversation_context,
                intent_analysis,
                chart_type_override,
                x_axis_override,
                y_axis_override
            )
            
            if not sql_query:
                # Try demo backup as fallback
                try:
                    from client_demo_backup import DemoBackup
                    backup_result = DemoBackup.get_backup_response(user_question)
                    
                    logger.warning("Using demo backup due to SQL generation failure")
                    return {
                        'success': True,
                        'summary': backup_result['summary'] + " (Using demo backup data)",
                        'data': backup_result['data'],
                        'chart': backup_result['chart'],
                        'explanation': "Demo backup used due to query generation issue",
                        'sql': "-- Demo backup query",
                        'row_count': backup_result['row_count'],
                        'intent': intent_analysis,
                        'data_domain': backup_result['domain'],
                        'timezone_used': user_timezone,
                        'suggestions': ["Show porter performance", "Count assets by department"],
                        'is_demo_backup': True
                    }
                except:
                    return {
                        'success': False,
                        'error': 'Failed to generate SQL query',
                        'summary': 'Unable to understand your question. Please try rephrasing.',
                        'suggestions': ["Show porter performance", "Count assets by department", "Show recent requests"]
                    }
            
            # Execute SQL query
            df, success = self.db.execute_query(sql_query, limit=row_limit)
            
            if not success or df.empty:
                # Try demo backup as fallback
                try:
                    from client_demo_backup import DemoBackup
                    backup_result = DemoBackup.get_backup_response(user_question)
                    
                    logger.warning("Using demo backup due to query execution failure")
                    return {
                        'success': True,
                        'summary': backup_result['summary'] + " (Using demo backup data)",
                        'data': backup_result['data'],
                        'chart': backup_result['chart'],
                        'explanation': "Demo backup used due to database query issue",
                        'sql': sql_query,
                        'row_count': backup_result['row_count'],
                        'intent': intent,
                        'data_domain': backup_result['domain'],
                        'timezone_used': user_timezone,
                        'suggestions': ["Show porter performance", "Count assets by department"],
                        'is_demo_backup': True
                    }
                except:
                    return {
                        'success': False,
                        'error': 'Query execution failed',
                        'summary': 'Database query failed. Please try a different question.',
                        'sql': sql_query,
                        'suggestions': ["Show porter performance", "Count assets by department", "Show recent requests"]
                    }
            
            # Format results with timezone conversion
            df_formatted = self.formatter.format_data_with_timezone(
                df.copy(),
                user_timezone,
                session_state.user_preferences['date_format']
            )
            
            # Generate consistent summary
            summary = self.formatter.generate_consistent_summary(df, user_question, intent)
            
            # Create chart with robust error handling
            chart = None
            final_chart_type = chart_type_override if chart_type_override and chart_type_override != 'auto' else intent.get('requested_chart_type', 'bar')
            
            if final_chart_type != 'table' and len(df) > 0:
                chart = self.formatter.create_robust_chart(
                    df, user_question, intent, final_chart_type, x_axis_override, y_axis_override)
            
            # Result
            result = {
                'success': True,
                'summary': summary,
                'data': df_formatted,
                'chart': chart,
                'explanation': explanation,
                'sql': sql_query,
                'row_count': len(df),
                'intent': intent,
                'data_domain': intent.get('data_domain', 'porter'),
                'timezone_used': user_timezone,
                'suggestions': [
                    "Show porter performance by facility",
                    "Count assets by department",
                    "Show warranty expiring assets",
                    "Show request trends over time"
                ],
                'is_demo_backup': False
            }
            
            # Update conversation state (only if not testing)
            if not self.testing_mode:
                session_state.conversation_state.add_interaction(user_question, result)
            
            set_cached_result(
                question=user_question,
                domain=result.get("data_domain", "porter"),
                result=result,
                row_limit=row_limit,
                chart_type=chart_type_override,
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            
            # Final fallback to demo backup
            try:
                from client_demo_backup import DemoBackup
                backup_result = DemoBackup.get_backup_response(user_question)
                
                logger.warning("Using demo backup due to unexpected error")
                return {
                    'success': True,
                    'summary': backup_result['summary'] + " (Emergency demo backup)",
                    'data': backup_result['data'],
                    'chart': backup_result['chart'],
                    'explanation': "Demo backup used due to system error",
                    'sql': "-- Emergency backup",
                    'row_count': backup_result['row_count'],
                    'intent': {'data_domain': backup_result['domain']},
                    'data_domain': backup_result['domain'],
                    'timezone_used': 'Asia/Kolkata',
                    'suggestions': ["Show porter performance", "Count assets by department"],
                    'is_demo_backup': True
                }
            except:
                return {
                    'success': False,
                    'error': str(e),
                    'summary': 'An error occurred while processing your request.',
                    'suggestions': ["Show porter performance", "Count assets by department"]
                }

