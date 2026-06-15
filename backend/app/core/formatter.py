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


# Column names that are ALWAYS dimensions, never measures —
# regardless of their SQL data type
DIMENSION_NAME_PATTERNS = [
    "year", "month", "day", "week", "quarter", "date", "period",
    "facility_id", "facility_name", "region", "department",
    "status", "category", "criticality", "name", "id",
]

def _is_dimension_column(col_name: str, series: "pd.Series") -> bool:
    """A column is a dimension if its NAME matches a known dimension
    pattern, OR if it's non-numeric. Measures are numeric AND not
    name-matched to a dimension pattern."""
    name_lower = col_name.lower()
    if any(pattern in name_lower for pattern in DIMENSION_NAME_PATTERNS):
        return True
    return series.dtype.kind not in "iuf"  # not int/uint/float


def build_chart_spec(df: "pd.DataFrame", intent: dict) -> Tuple[dict, "pd.DataFrame"]:
    import pandas as pd

    if df.empty:
        return _table_only_spec(0), df

    if len(df) == 1:
        # Single row — no meaningful bar/line/pie/scatter. Show as a
        # stat-card-style table only.
        return _table_only_spec(1), df

    dimension_cols = [c for c in df.columns if _is_dimension_column(c, df[c]) and df[c].notna().any()]
    measure_cols   = [c for c in df.columns if not _is_dimension_column(c, df[c]) and df[c].notna().any() and df[c].nunique() > 1]

    if not measure_cols:
        return _table_only_spec(len(df)), df

    # Pick the best dimension (prefer time-based, then facility/category)
    time_dims = [c for c in dimension_cols if any(p in c.lower() for p in ["year", "month", "day", "week", "date", "period"])]
    if time_dims:
        # Among time dimensions, prefer the one with MORE distinct values
        # AND prefer finer granularity (month > year, day > month) when
        # cardinality is similar — this ensures "by month" questions chart
        # by month even if "year" also exists as a column
        GRANULARITY_RANK = {"day": 4, "week": 3, "month": 2, "quarter": 2, "year": 1, "date": 3, "period": 2}

        def time_dim_score(col):
            rank = max((v for k, v in GRANULARITY_RANK.items() if k in col.lower()), default=0)
            return (df[col].nunique(), rank)

        primary_dim = max(time_dims, key=time_dim_score)
    else:
        primary_dim = dimension_cols[0] if dimension_cols else None

    MONTH_NAMES = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
        "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun",
        "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
    }

    if primary_dim == "month":
        df = df.copy()
        if "year" in dimension_cols:
            df["_period"] = df.apply(
                lambda row: f"{MONTH_NAMES.get(str(row['month']).split('.')[0], row['month'])} {int(row['year']) if pd.notna(row['year']) else ''}".strip(),
                axis=1
            )
            df["_period_sort"] = df["year"].astype(float).fillna(0) * 12 + df["month"].astype(float).fillna(0)
        else:
            df["_period"] = df.apply(
                lambda row: f"{MONTH_NAMES.get(str(row['month']).split('.')[0], row['month'])}",
                axis=1
            )
            df["_period_sort"] = df["month"].astype(float).fillna(0)
            
        dimension_cols = dimension_cols + ["_period"]
        primary_dim = "_period"

    # Pick the best measure (highest variance = most informative, or prioritize KPIs if performance_focus)
    selected_measures = _select_chart_measures(df, measure_cols, intent)
    primary_measure = selected_measures[0] if selected_measures else ""

    recommendations = []

    def _group_measures_by_scale(m_cols: list) -> list:
        rate_cols  = [c for c in m_cols if "rate" in c.lower() or "percent" in c.lower()]
        tat_cols   = [c for c in m_cols if "tat" in c.lower() or "minute" in c.lower() or "duration" in c.lower()]
        count_cols = [c for c in m_cols if c not in rate_cols and c not in tat_cols]

        groups = []
        if len(count_cols) >= 2:
            groups.append(count_cols[:3])
        if len(rate_cols) >= 2:
            groups.append(rate_cols[:3])
        return groups

    series_groups = _group_measures_by_scale(measure_cols)

    sort_by_col = "_period_sort" if primary_dim == "_period" else None

    # 1. Bar chart (Good for categorical + 1 measure, or time + 1 measure)
    if dimension_cols:
        if len(selected_measures) > 1:
            rec = {
                "type": "bar", "label": f"Bar Chart ({len(selected_measures)} series)",
                "x": primary_dim, "y": primary_measure, "icon": "BarChart2",
                "series": selected_measures
            }
            if sort_by_col:
                rec["sort_x_by"] = sort_by_col
            recommendations.append(rec)
        else:
            added_bar = False
            for group in series_groups:
                if primary_measure in group or not series_groups:
                    rec = {
                        "type": "bar",
                        "label": f"Bar Chart ({len(group)} series)" if len(group) > 1 else "Bar Chart",
                        "x": primary_dim,
                        "y": primary_measure,
                        "icon": "BarChart2",
                        "series": group if len(group) > 1 else None
                    }
                    if sort_by_col:
                        rec["sort_x_by"] = sort_by_col
                    recommendations.append(rec)
                    added_bar = True
                    break
            if not added_bar:
                 rec = {"type": "bar", "label": "Bar Chart", "x": primary_dim, "y": primary_measure, "icon": "BarChart2"}
                 if sort_by_col:
                     rec["sort_x_by"] = sort_by_col
                 recommendations.append(rec)

    # 2. Line chart (Only makes sense if x is time/period)
    has_time = primary_dim in time_dims or primary_dim == "_period"
    if has_time:
        sort_as = "numeric" if primary_dim in df.columns and df[primary_dim].dtype.kind in "iuf" else "string"
        if len(selected_measures) > 1:
            rec = {
                "type": "line", "label": f"Line Chart ({len(selected_measures)} series)",
                "x": primary_dim, "y": primary_measure, "icon": "LineChart",
                "series": selected_measures, "sort_x_as": sort_as
            }
            if sort_by_col:
                rec["sort_x_by"] = sort_by_col
            recommendations.append(rec)
        else:
            added_line = False
            for group in series_groups:
                if primary_measure in group or not series_groups:
                    rec = {
                        "type": "line",
                        "label": f"Line Chart ({len(group)} series)" if len(group) > 1 else "Line Chart",
                        "x": primary_dim,
                        "y": primary_measure,
                        "icon": "LineChart",
                        "series": group if len(group) > 1 else None,
                        "sort_x_as": sort_as
                    }
                    if sort_by_col:
                        rec["sort_x_by"] = sort_by_col
                    recommendations.append(rec)
                    added_line = True
                    break
            if not added_line:
                 rec = {"type": "line", "label": "Line Chart", "x": primary_dim, "y": primary_measure, "icon": "LineChart", "sort_x_as": sort_as}
                 if sort_by_col:
                     rec["sort_x_by"] = sort_by_col
                 recommendations.append(rec)

    # PIE: dimension with 2-15 categories, but NOT for time-series dimensions
    is_time_dimension = primary_dim in time_dims or primary_dim == "_period"
    if primary_dim and 2 <= df[primary_dim].nunique() <= 15 and not is_time_dimension:
        recommendations.append({
            "type": "pie", "label": "Pie Chart",
            "x": primary_dim, "y": primary_measure, "icon": "PieChart",
        })

    # SCATTER: only if there are 2+ DISTINCT measures (not dimension vs measure)
    usable_measures = [c for c in measure_cols if df[c].nunique() > 1]
    if len(usable_measures) >= 2 and len(df) >= 3:
        recommendations.append({
            "type": "scatter", "label": "Scatter Plot",
            "x": usable_measures[0], "y": usable_measures[1], "icon": "ScatterChart",
        })

    recommendations.append({"type": "table", "label": "Data Table", "x": "", "y": "", "icon": "Table2"})

    if not recommendations or recommendations[0]["type"] == "table":
        # Nothing meaningful to chart — table only
        return _table_only_spec(len(df)), df

    # Honor requested chart type if valid, else use first recommendation
    intent_chart = intent.get("chart_type", "auto")
    valid_types = [r["type"] for r in recommendations]
    fallback_reason = None
    if intent_chart != "auto" and intent_chart in valid_types:
        primary = intent_chart
    else:
        if intent_chart != "auto" and intent_chart != "table":
            fallback_reason = f"A {intent_chart} chart wasn't suitable for this data (showing {recommendations[0]['type']} instead)"
        primary = recommendations[0]["type"]

    recommendations.sort(key=lambda r: r["type"] != primary)

    return {
        "recommendations": recommendations,
        "active": primary,
        "fallback_reason": fallback_reason,
        "columns": {
            "dimensions": dimension_cols,
            "measures":   measure_cols,
            # Keep old keys for backward compat with any existing frontend code
            "numeric":     measure_cols,
            "categorical": [c for c in dimension_cols if df[c].dtype.kind not in "iuf"],
            "date":        [c for c in dimension_cols if "date" in c.lower() or df[c].dtype.kind == "M"],
        },
        "row_count": len(df),
    }, df


def _table_only_spec(row_count: int) -> dict:
    return {
        "recommendations": [{"type": "table", "label": "Data Table", "x": "", "y": "", "icon": "Table2"}],
        "active": "table",
        "fallback_reason": None,
        "columns": {"dimensions": [], "measures": [], "numeric": [], "categorical": [], "date": []},
        "row_count": row_count,
    }


PERFORMANCE_MEASURE_PRIORITY = ["completion_rate", "avg_tat_minutes", "cancellation_rate", "active_rate", "maintenance_rate"]

def _select_chart_measures(df, measure_cols: list, intent: dict) -> list[str]:
    """
    Determine which measure column(s) to chart, in priority order:
    1. EXPLICITLY REQUESTED metrics from the question
    2. If performance_focus=true AND nothing explicitly requested,
       fall back to performance KPIs
    3. Otherwise, highest-variance numeric column
    """
    if not measure_cols:
        return []

    requested = intent.get("requested_metrics", [])
    matched = [m for m in requested if m in measure_cols]
    if matched:
        return matched[:3]

    if intent.get("performance_focus"):
        for col in PERFORMANCE_MEASURE_PRIORITY:
            if col in measure_cols:
                return [col]

    return [_best_numeric_col(df, measure_cols)]

def _best_numeric_col(df, numeric_cols: list, prefer_performance: bool = False) -> str:
    """Pick the 'best' numeric column to chart by default."""
    if not numeric_cols:
        return ""
    if len(numeric_cols) == 1:
        return numeric_cols[0]

    if prefer_performance:
        for col in PERFORMANCE_MEASURE_PRIORITY:
            if col in numeric_cols:
                return col

    # Fall back to highest variance in numeric_cols
    variances = {c: df[c].var() for c in numeric_cols if df[c].notna().any()}
    return max(variances, key=variances.get) if variances else numeric_cols[0]
