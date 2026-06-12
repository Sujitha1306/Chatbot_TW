import logging
import numpy as np
import pandas as pd
import pytz
import plotly.express as px
import plotly.graph_objects as go
from typing import Dict, List, Any, Optional, Tuple
from backend.config.schema import DatabaseSchema
from backend.config.settings import Config

logger = logging.getLogger(__name__)

class EnhancedResultFormatter:
    """Enhanced result formatting with robust chart generation."""
    
    @staticmethod
    def format_data_with_timezone(df: pd.DataFrame, user_timezone: str = "UTC", date_format: str = "ISO") -> pd.DataFrame:
        """Format data with proper timezone conversion."""
        if df.empty:
            return df
            
        try:
            # Get timezone objects
            utc_tz = pytz.UTC
            user_tz = pytz.timezone(user_timezone)
            
            # Get date format pattern
            format_config = Config.DATE_FORMATS.get(date_format, Config.DATE_FORMATS['ISO'])
            date_only_format = format_config['strftime']
            
            for col in df.columns:
                # Handle time columns - convert from UTC to user timezone
                if col in DatabaseSchema.TIME_COLUMNS or 'time' in col.lower() or col.endswith('_date') or col.endswith('_due') or col.endswith('_on'):
                    try:
                        if not df[col].empty and df[col].notna().any():
                            # Convert to datetime if not already
                            df_col = pd.to_datetime(df[col], errors='coerce', utc=True)
                            
                            if df_col.notna().any():
                                # Convert from UTC to user timezone
                                df_col_local = df_col.dt.tz_convert(user_tz)
                                # Format according to user preference - DATE ONLY
                                df[col] = df_col_local.dt.strftime(date_only_format)
                                
                    except Exception as e:
                        logger.warning(f"Could not format date column {col}: {str(e)}")
                
                # Handle TAT and time duration columns - keep as numeric minutes
                elif 'tat' in col.lower() or 'turnaround' in col.lower() or col.endswith('_minutes'):
                    try:
                        if not df[col].empty and df[col].notna().any():
                            df[col] = pd.to_numeric(df[col], errors='coerce')
                    except Exception as e:
                        logger.warning(f"Could not format numeric column {col}: {str(e)}")
                        
        except Exception as e:
            logger.error(f"Data formatting failed: {str(e)}")
            
        return df
    
    @staticmethod
    def create_robust_chart(df: pd.DataFrame, question: str, intent: Dict, 
                           chart_type: str = "auto", x_axis: str = None, y_axis: str = None):
        """Create charts with robust error handling and fallbacks."""
        
        if df.empty or len(df.columns) < 1:
            logger.warning("Cannot create chart: DataFrame is empty")
            return None
        
        try:
            # Use specified chart type or auto-detect
            if chart_type == "auto":
                chart_type = EnhancedResultFormatter._detect_chart_type(df, intent)
            
            logger.info(f"Creating {chart_type} chart for {len(df)} rows")
            
            # Get column info
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = df.select_dtypes(include=['object', 'string']).columns.tolist()
            
            # Auto-select axes if not provided
            if not x_axis or x_axis not in df.columns:
                x_axis = categorical_cols[0] if categorical_cols else df.columns[0]
            if not y_axis or y_axis not in df.columns:
                y_axis = numeric_cols[0] if numeric_cols else (df.columns[1] if len(df.columns) > 1 else df.columns[0])
            
            # Create chart based on type with error handling
            try:
                if chart_type == "bar":
                    return EnhancedResultFormatter._create_bar_chart_robust(df, x_axis, y_axis)
                elif chart_type == "pie":
                    return EnhancedResultFormatter._create_pie_chart_robust(df, x_axis, y_axis)
                elif chart_type == "line":
                    return EnhancedResultFormatter._create_line_chart_robust(df, x_axis, y_axis)
                elif chart_type == "scatter":
                    return EnhancedResultFormatter._create_scatter_chart_robust(df, x_axis, y_axis)
                elif chart_type == "heatmap":
                    return EnhancedResultFormatter._create_heatmap_robust(df, x_axis, y_axis)
                else:
                    # Default fallback
                    return EnhancedResultFormatter._create_bar_chart_robust(df, x_axis, y_axis)
                    
            except Exception as chart_error:
                logger.error(f"Specific chart creation failed: {str(chart_error)}")
                # Try simple bar chart as fallback
                return EnhancedResultFormatter._create_simple_fallback_chart(df)
                
        except Exception as e:
            logger.error(f"Chart creation completely failed: {str(e)}")
            return None
    
    @staticmethod
    def _detect_chart_type(df: pd.DataFrame, intent: Dict) -> str:
        """Detect optimal chart type based on data."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'string']).columns
        
        # Check for time columns
        time_cols = [col for col in df.columns if 'time' in col.lower() or 'date' in col.lower()]
        
        if time_cols and len(numeric_cols) > 0:
            return "line"
        elif len(categorical_cols) > 0 and len(numeric_cols) > 0:
            if len(df) <= 10:
                return "pie"
            else:
                return "bar"
        elif len(numeric_cols) >= 2:
            return "scatter"
        else:
            return "bar"
    
    @staticmethod
    def _create_bar_chart_robust(df: pd.DataFrame, x_axis: str, y_axis: str):
        """Create robust bar chart."""
        try:
            # Ensure data is valid
            df_clean = df.dropna(subset=[x_axis, y_axis])
            if df_clean.empty:
                return None
                
            fig = px.bar(
                df_clean, 
                x=x_axis, 
                y=y_axis,
                title=f"Bar Chart: {y_axis} by {x_axis}",
                color_discrete_sequence=['#667eea']
            )
            
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font=dict(color='#333'),
                height=500
            )
            
            # Rotate labels if many categories
            if len(df_clean) > 10:
                fig.update_layout(xaxis_tickangle=-45)
                
            return fig
            
        except Exception as e:
            logger.error(f"Bar chart creation failed: {str(e)}")
            return None
    
    @staticmethod
    def _create_pie_chart_robust(df: pd.DataFrame, x_axis: str, y_axis: str):
        """Create robust pie chart."""
        try:
            df_clean = df.dropna(subset=[x_axis, y_axis])
            if df_clean.empty:
                return None
                
            # Limit to top categories for readability
            if len(df_clean) > 10:
                df_clean = df_clean.nlargest(10, y_axis)
                
            fig = px.pie(
                df_clean,
                names=x_axis,
                values=y_axis,
                title=f"Distribution: {y_axis} by {x_axis}"
            )
            
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font=dict(color='#333'),
                height=500
            )
            
            return fig
            
        except Exception as e:
            logger.error(f"Pie chart creation failed: {str(e)}")
            return None
    
    @staticmethod
    def _create_line_chart_robust(df: pd.DataFrame, x_axis: str, y_axis: str):
        """Create robust line chart."""
        try:
            df_clean = df.dropna(subset=[x_axis, y_axis])
            if df_clean.empty:
                return None
                
            fig = px.line(
                df_clean,
                x=x_axis,
                y=y_axis,
                title=f"Trend: {y_axis} over {x_axis}",
                markers=True,
                color_discrete_sequence=['#667eea']
            )
            
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font=dict(color='#333'),
                height=500
            )
            
            return fig
            
        except Exception as e:
            logger.error(f"Line chart creation failed: {str(e)}")
            return None
    
    @staticmethod
    def _create_scatter_chart_robust(df: pd.DataFrame, x_axis: str, y_axis: str):
        """Create robust scatter chart."""
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) < 2:
                return None
                
            x_col = x_axis if x_axis in numeric_cols else numeric_cols[0]
            y_col = y_axis if y_axis in numeric_cols else numeric_cols[1]
            
            df_clean = df.dropna(subset=[x_col, y_col])
            if df_clean.empty:
                return None
                
            fig = px.scatter(
                df_clean,
                x=x_col,
                y=y_col,
                title=f"Scatter Plot: {y_col} vs {x_col}",
                color_discrete_sequence=['#667eea']
            )
            
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font=dict(color='#333'),
                height=500
            )
            
            return fig
            
        except Exception as e:
            logger.error(f"Scatter chart creation failed: {str(e)}")
            return None
    
    @staticmethod
    def _create_heatmap_robust(df: pd.DataFrame, x_axis: str, y_axis: str):
        """Create robust heatmap."""
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            categorical_cols = df.select_dtypes(include=['object', 'string']).columns
            
            if len(categorical_cols) >= 2 and len(numeric_cols) >= 1:
                # Pivot heatmap
                x_col = x_axis if x_axis in categorical_cols else categorical_cols[0]
                y_col = y_axis if y_axis in categorical_cols else (categorical_cols[1] if len(categorical_cols) > 1 else categorical_cols[0])
                value_col = numeric_cols[0]
                
                pivot_data = df.pivot_table(
                    values=value_col,
                    index=y_col,
                    columns=x_col,
                    aggfunc='mean'
                ).fillna(0)
                
                fig = px.imshow(
                    pivot_data,
                    title=f"Heatmap: {value_col} by {y_col} vs {x_col}",
                    color_continuous_scale='Blues'
                )
                
            elif len(numeric_cols) > 1:
                # Correlation heatmap
                corr_matrix = df[numeric_cols].corr()
                fig = px.imshow(
                    corr_matrix,
                    title="Correlation Heatmap",
                    color_continuous_scale='RdBu_r'
                )
            else:
                return None
                
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font=dict(color='#333'),
                height=500
            )
            
            return fig
            
        except Exception as e:
            logger.error(f"Heatmap creation failed: {str(e)}")
            return None
    
    @staticmethod
    def _create_simple_fallback_chart(df: pd.DataFrame):
        """Simple fallback chart when all else fails."""
        try:
            if len(df.columns) >= 2:
                x_col = df.columns[0]
                y_col = df.columns[1]
                
                fig = px.bar(
                    df.head(20),  # Limit to 20 rows
                    x=x_col,
                    y=y_col,
                    title="Data Visualization",
                    color_discrete_sequence=['#667eea']
                )
                
                fig.update_layout(
                    plot_bgcolor='rgba(0,0,0,0)',
                    paper_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='#333'),
                    height=400
                )
                
                return fig
            
        except Exception as e:
            logger.error(f"Fallback chart creation failed: {str(e)}")
            
        return None
    
    @staticmethod
    def generate_consistent_summary(df: pd.DataFrame, question: str, intent: Dict) -> str:
        """Generate consistent AI summary with fallback."""
        
        if df.empty:
            return "❌ No results found for your query."
        
        data_domain = intent.get('data_domain', 'porter')
        
        # Simple template-based summary for consistency
        summary_templates = {
            "porter": f"✅ Porter Analytics: Found {len(df):,} porter records with {len(df.columns)} data points. ",
            "asset": f"✅ Asset Analysis: Found {len(df):,} asset records with {len(df.columns)} data points. "
        }
        
        base_summary = summary_templates.get(data_domain, f"✅ Analysis complete: Found {len(df):,} records. ")
        
        # Add specific insights based on data
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                first_numeric = numeric_cols[0]
                if df[first_numeric].notna().any():
                    avg_val = df[first_numeric].mean()
                    min_val = df[first_numeric].min()
                    max_val = df[first_numeric].max()
                    base_summary += f"Average {first_numeric}: {avg_val:.1f}, Range: {min_val:.1f} to {max_val:.1f}."
        except:
            pass
            
            
        return base_summary


def build_chart_spec(df: pd.DataFrame, intent: dict) -> dict:
    """
    Returns a chart spec dict. The frontend renders and re-renders
    this entirely client-side — no extra API calls for chart changes.
    """
    numeric_cols     = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(include="object").columns.tolist()
    date_cols        = df.select_dtypes(include=["datetime", "datetimetz"]).columns.tolist()

    intent_chart = intent.get("chart_type", "auto")
    if intent_chart == "auto":
        intent_chart = _auto_chart(df, categorical_cols, numeric_cols, date_cols)

    recommendations = []

    if categorical_cols and numeric_cols:
        recommendations += [
            {"type": "bar",   "label": "Bar Chart",  "x": categorical_cols[0], "y": numeric_cols[0], "icon": "bar-chart-2"},
            {"type": "pie",   "label": "Pie Chart",   "x": categorical_cols[0], "y": numeric_cols[0], "icon": "pie-chart"},
        ]
    if (date_cols or categorical_cols) and numeric_cols:
        x_col = date_cols[0] if date_cols else categorical_cols[0]
        recommendations.append(
            {"type": "line",  "label": "Line Chart",  "x": x_col,              "y": numeric_cols[0], "icon": "line-chart"},
        )
    if len(numeric_cols) >= 2:
        recommendations.append(
            {"type": "scatter","label": "Scatter",    "x": numeric_cols[0],    "y": numeric_cols[1], "icon": "scatter-chart"},
        )

    # Put recommended type first
    recommendations.sort(key=lambda r: r["type"] != intent_chart)

    return {
        "recommendations": recommendations,
        "active": intent_chart,
        "columns": {"numeric": numeric_cols, "categorical": categorical_cols, "date": date_cols},
        "row_count": len(df),
    }


def _auto_chart(df, cat_cols, num_cols, date_cols) -> str:
    if date_cols and num_cols:        return "line"
    if cat_cols and num_cols:
        if len(df[cat_cols[0]].unique()) <= 6: return "pie"
        return "bar"
    if len(num_cols) >= 2:            return "scatter"
    return "bar"
