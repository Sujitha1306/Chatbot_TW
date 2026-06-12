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


def build_chart_spec(df: "pd.DataFrame", intent: dict) -> dict:
    import pandas as pd

    if df.empty:
        return {
            "recommendations": [{"type": "table", "label": "Data Table", "x": "", "y": "", "icon": "table"}],
            "active": "table",
            "columns": {"numeric": [], "categorical": [], "date": []},
            "row_count": 0,
        }

    numeric_cols     = [c for c in df.select_dtypes(include="number").columns if df[c].notna().any()]
    categorical_cols = [c for c in df.select_dtypes(include="object").columns if df[c].notna().any() and df[c].nunique() > 1]
    date_cols        = df.select_dtypes(include=["datetime", "datetimetz"]).columns.tolist()

    if len(numeric_cols) <= 1 and not categorical_cols and not date_cols:
        return {
            "recommendations": [{"type": "table", "label": "Data Table", "x": "", "y": "", "icon": "table"}],
            "active": "table",
            "columns": {"numeric": numeric_cols, "categorical": [], "date": []},
            "row_count": len(df),
            "single_value": True,
        }

    recommendations = []

    # BAR: needs a categorical column with >1 unique value AND a numeric column with non-zero variance
    if categorical_cols and numeric_cols:
        num_col = _best_numeric_col(df, numeric_cols)
        cat_col = categorical_cols[0]
        if df[num_col].sum() != 0:
            recommendations.append({"type": "bar", "label": "Bar Chart", "x": cat_col, "y": num_col, "icon": "bar-chart-2"})

    # PIE: needs categorical with 2-15 unique values
    if categorical_cols and numeric_cols:
        cat_col = categorical_cols[0]
        n_unique = df[cat_col].nunique()
        num_col = _best_numeric_col(df, numeric_cols)
        if 2 <= n_unique <= 15 and df[num_col].sum() != 0:
            recommendations.append({"type": "pie", "label": "Pie Chart", "x": cat_col, "y": num_col, "icon": "pie-chart"})

    # LINE: needs date column OR a categorical column that represents a sequence
    line_x = _find_sequential_column(df, date_cols, categorical_cols)
    if line_x and numeric_cols:
        num_col = _best_numeric_col(df, numeric_cols)
        if df[line_x].nunique() >= 2 and df[num_col].nunique() > 1:
            sort_hint = "date" if line_x in date_cols else ("numeric" if df[line_x].astype(str).str.match(r'^\d+$').all() else "string")
            recommendations.append({
                "type": "line", "label": "Line Chart", "x": line_x, "y": num_col,
                "icon": "line-chart", "sort_x_as": sort_hint
            })

    # SCATTER: needs 2 numeric columns, both with variance, at least 3 rows
    usable_numeric = [c for c in numeric_cols if df[c].nunique() > 1]
    if len(usable_numeric) >= 2 and len(df) >= 3:
        recommendations.append({"type": "scatter", "label": "Scatter Plot", "x": usable_numeric[0], "y": usable_numeric[1], "icon": "scatter-chart"})

    # TABLE: always available as a fallback
    recommendations.append({"type": "table", "label": "Data Table", "x": "", "y": "", "icon": "table"})

    intent_chart = intent.get("chart_type", "auto")
    valid_types = [r["type"] for r in recommendations]
    if intent_chart == "auto" or intent_chart not in valid_types:
        primary = recommendations[0]["type"]
    else:
        primary = intent_chart
        
    fallback_reason = None
    if intent_chart != "auto" and intent_chart not in valid_types:
        fallback_reason = f"A {intent_chart} chart wasn't suitable for this data (showing {primary} instead)"

    recommendations.sort(key=lambda r: r["type"] != primary)

    return {
        "recommendations": recommendations,
        "active": primary,
        "fallback_reason": fallback_reason,
        "columns": {"numeric": numeric_cols, "categorical": categorical_cols, "date": date_cols},
        "row_count": len(df),
        "single_value": len(numeric_cols) <= 1 and not categorical_cols and not date_cols and len(df) == 1
    }

def _best_numeric_col(df, numeric_cols: list) -> str:
    if len(numeric_cols) == 1:
        return numeric_cols[0]
    variances = {c: df[c].var() for c in numeric_cols if df[c].notna().any()}
    return max(variances, key=variances.get) if variances else numeric_cols[0]

def _find_sequential_column(df, date_cols: list, categorical_cols: list) -> str | None:
    if date_cols:
        return date_cols[0]
        
    import re
    TIME_PATTERNS = [
        re.compile(r"^\d{4}-\d{2}(-\d{2})?$"),
        re.compile(r"^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", re.I),
        re.compile(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)", re.I),
        re.compile(r"^Week\s*\d+$", re.I),
        re.compile(r"^\d{1,2}:00$"),
    ]
    for col in categorical_cols:
        sample = df[col].dropna().astype(str).head(5)
        if any(any(p.match(v) for p in TIME_PATTERNS) for v in sample):
            return col

    return None
