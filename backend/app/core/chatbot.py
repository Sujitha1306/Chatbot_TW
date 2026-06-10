import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from backend.config.settings import Config
from backend.config.schema import ConversationState
from backend.app.db.clickhouse import ClickHouseConnection
from backend.app.core.sql_pipeline import SQLGenerationPipeline
from backend.app.core.formatter import EnhancedResultFormatter
from backend.app.core.cache import get_cached_result, set_cached_result, restore_chart_from_cache

logger = logging.getLogger(__name__)

class TrackerWaveChatbot:
    """TrackerWave unified analytics chatbot with improved reliability."""
    
    def __init__(self, testing_mode=False):
        self.db = ClickHouseConnection()
        self.testing_mode = testing_mode
        
        try:
            self.sql_pipeline = SQLGenerationPipeline()
        except ValueError as e:
            logger.error(f"Failed to initialize SQL Pipeline: {str(e)}")
            raise
        
        self.formatter = EnhancedResultFormatter()
        
        # Initialize memory session state for API
        self.conversation_state = ConversationState()
        self.user_preferences = {
            'date_format': 'ISO',
            'timezone': self._detect_user_timezone()
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
        """Get memory session state."""
        return type('MockSessionState', (), {
            'conversation_state': self.conversation_state,
            'user_preferences': self.user_preferences
        })()
    
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
                    from backend.app.core.demo_backup import DemoBackup
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
                    return {
                        'success': False,
                        'error': f"Demo backup failed: {str(backup_error)}",
                        'summary': "The demo backup could not be loaded."
                    }
            
            # [0.5] Cache lookup
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
            
            conversation_context = session_state.conversation_state.get_conversation_context()
            user_timezone = session_state.user_preferences.get('timezone', 'Asia/Kolkata')
            
            # Run SQL Pipeline
            sql, intent, df, success, error_msg = self.sql_pipeline.run(
                question=user_question,
                history=conversation_context,
            )
            
            if not success:
                return {
                    "success": False,
                    "error": f"Query failed: {error_msg}",
                    "sql": sql,
                    "summary": "The query could not be executed. Please try rephrasing your question.",
                    "row_count": 0,
                    "data_domain": intent.get("data_domain", "porter"),
                    "suggestions": ["Show porter performance", "Count assets by department", "Show recent requests"]
                }
            
            # Format results with timezone conversion
            df_formatted = self.formatter.format_data_with_timezone(
                df.copy(),
                user_timezone,
                session_state.user_preferences['date_format']
            )
            
            summary = self.sql_pipeline.generate_summary(user_question, df, intent)
            followups = self.sql_pipeline.generate_followups(user_question, intent)
            
            # Create chart with robust error handling
            chart = None
            final_chart_type = chart_type_override if chart_type_override and chart_type_override != 'auto' else intent.get('chart_type', 'bar')
            
            if final_chart_type != 'table' and len(df) > 0:
                chart = self.formatter.create_robust_chart(
                    df, user_question, intent, final_chart_type, x_axis_override, y_axis_override)
            
            result = {
                'success': True,
                'summary': summary,
                'data': df_formatted,
                'chart': chart,
                'explanation': "SQL generated dynamically based on context.",
                'sql': sql,
                'row_count': len(df),
                'intent': intent,
                'data_domain': intent.get('data_domain', 'porter'),
                'timezone_used': user_timezone,
                'suggestions': followups,
                'is_demo_backup': False
            }
            
            session_state.conversation_state.add_interaction(user_question, result)
            
            set_cached_result(
                question=user_question,
                domain=intent.get("data_domain", "porter"),
                result=result,
                row_limit=row_limit,
                chart_type=chart_type_override,
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'summary': 'An error occurred while processing your request.',
                'suggestions': ["Show porter performance", "Count assets by department"]
            }

