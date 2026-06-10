import yaml
import streamlit as st
import streamlit_authenticator as stauth
from yaml.loader import SafeLoader
from datetime import datetime
from app.core.chatbot import TrackerWaveChatbot
from config.settings import Config

def load_auth_config() -> dict:
    with open("config/auth.yaml") as f:
        return yaml.load(f, Loader=SafeLoader)

def main():
    """TrackerWave Streamlit application with improved UI."""
    
    st.set_page_config(
        page_title="TrackerWave Analytics",
        page_icon="assets/1TW_Logo.svg",  # Local file path
        layout="wide",
        initial_sidebar_state="collapsed"
    )
    
    # Auth setup
    auth_config = load_auth_config()
    authenticator = stauth.Authenticate(
        auth_config["credentials"],
        auth_config["cookie"]["name"],
        auth_config["cookie"]["key"],
        auth_config["cookie"]["expiry_days"],
        auth_config.get("preauthorized", {}).get("emails", []),
    )

    name, authentication_status, username = authenticator.login(
        "main"
    )

    if authentication_status is False:
        st.error("Username or password is incorrect.")
        return

    if authentication_status is None:
        st.warning("Please enter your credentials.")
        return

    # ── authenticated from here down ──────────────────────────────────────
    authenticator.logout("Logout", "sidebar")
    st.sidebar.write(f"Logged in as **{name}**")
    
    run_chatbot_ui()

def run_chatbot_ui():
    """TrackerWave Streamlit application with improved UI."""
    
    # Force light theme
    st.markdown("""
    <style>
    .stApp {
        color: #262730;
        background-color: #FFFFFF;
    }
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        padding: 2rem;
        border-radius: 12px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }
    .metric-card {
        background: linear-gradient(145deg, #ffffff 0%, #f8f9fd 100%);
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e1e8f0;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        margin-bottom: 1rem;
    }
    .status-success {
        background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    .status-error {
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    .chart-controls {
        background: #f8f9fd;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header
    st.markdown("""
    <div class="main-header">
        <h1 style="color: #00FFFF;">TrackerWave Analytics</h1>
        <p>Advanced Porter Request Management & Asset Analytics with GPT-4.1 AI Intelligence</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Initialize chatbot
    try:
        chatbot = TrackerWaveChatbot(testing_mode=False)  # Normal Streamlit mode
    except Exception as e:
        st.error(f"Failed to initialize chatbot: {str(e)}")
        st.stop()
    
    # Show detected timezone
    user_tz = st.session_state.user_preferences.get('timezone', 'UTC')
    st.info(f"🌍 **Detected Timezone:** {user_tz} | All times will be converted from UTC to your local timezone")
    
    # Query interface
    st.markdown("### Analytics Query Interface")
    
    # Persistent chart controls (separate from query)
    with st.expander("Chart Visualization Controls", expanded=False):
        st.markdown('<div class="chart-controls">', unsafe_allow_html=True)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            persistent_chart_type = st.selectbox(
                "Chart Type:",
                ["auto", "bar", "line", "pie", "scatter", "heatmap", "table"],
                key="persistent_chart_type"
            )
        
        with col2:
            persistent_x_axis = st.text_input(
                "X-Axis (optional):",
                placeholder="e.g., facility_id",
                key="persistent_x_axis"
            )
        
        with col3:
            persistent_y_axis = st.text_input(
                "Y-Axis (optional):",
                placeholder="e.g., request_count",
                key="persistent_y_axis"
            )
        
        with col4:
            date_format = st.selectbox(
                "Date Format:",
                ['ISO (YYYY-MM-DD)', 'US (MM/DD/YYYY)', 'EU (DD/MM/YYYY)'],
                index=0,
                key="date_format_select"
            )
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Update date format preference
    format_map = {
        'ISO (YYYY-MM-DD)': 'ISO',
        'US (MM/DD/YYYY)': 'US', 
        'EU (DD/MM/YYYY)': 'EU'
    }
    selected_format = format_map[date_format]
    if selected_format != st.session_state.user_preferences['date_format']:
        st.session_state.user_preferences['date_format'] = selected_format
    
    # Main query input
    user_input = st.text_area(
        "Enter your analytics query:",
        placeholder="e.g., 'Show porter performance by facility' or 'Count assets by department'",
        height=100,
        key="main_query_input"
    )
    
    # Action buttons
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        analyze_button = st.button("Analyze Query", type="primary", use_container_width=True)
    
    with col2:
        row_limit = st.selectbox(
            "Max rows:",
            [100, 500, 1000, "All"],
            index=0
        )
        if row_limit == "All":
            row_limit = None
    
    with col3:
        if st.button("Clear Results", use_container_width=True):
            if 'last_result' in st.session_state:
                del st.session_state.last_result
            st.rerun()
    
    # Process query
    if analyze_button and user_input.strip():
        start_time = datetime.now()
        
        with st.spinner("Processing your analytics query..."):
            # Get chart controls
            chart_type = persistent_chart_type if persistent_chart_type != "auto" else None
            x_axis = persistent_x_axis.strip() if persistent_x_axis.strip() else None
            y_axis = persistent_y_axis.strip() if persistent_y_axis.strip() else None
            
            # Check if demo backup should be used
            use_backup = st.session_state.get('use_demo_backup', False)
            
            result = chatbot.process_query(
                user_input.strip(),
                row_limit=row_limit,
                chart_type_override=chart_type,
                x_axis_override=x_axis,
                y_axis_override=y_axis,
                use_demo_backup=use_backup
            )
            
            # Store result for persistence
            st.session_state.last_result = result
        
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        
        # Display results
        if result['success']:
            # Show if demo backup was used
            if result.get('is_demo_backup', False):
                st.warning("🎭 **Demo Backup Data** - Using pre-prepared presentation data for reliable client demo")
            
            # Success indicator
            domain_name = result.get('data_domain', 'porter').title()
            st.markdown(f"""
            <div class="status-success">
                <strong>🎯 {domain_name} Analytics Complete</strong><br>
                {result['summary']}
            </div>
            """, unsafe_allow_html=True)
            
            # Performance metrics
            col1, col2, col3, col4, col5 = st.columns(5)
            with col1:
                st.metric("Execution Time", f"{execution_time:.1f}s")
            with col2:
                st.metric("Records Found", f"{result['row_count']:,}")
            with col3:
                st.metric("Data Domain", domain_name)
            with col4:
                st.metric("Timezone", result.get('timezone_used', 'UTC'))
            with col5:
                if result.get("from_cache"):
                    st.metric("Source", "⚡ Cache", help="Result served from cache")
                else:
                    st.metric("Source", "🔄 Live", help="Fresh result from database")
            
            # Data display
            if not result['data'].empty:
                st.markdown("### 📊 Data Results")
                st.dataframe(
                    result['data'],
                    use_container_width=True,
                    hide_index=True
                )
                
                # Chart display
                if result['chart'] is not None:
                    st.markdown("### 📈 Data Visualization")
                    st.plotly_chart(result['chart'], use_container_width=True)
                else:
                    st.info("💡 Chart not generated. Try different chart settings above or use table view.")
                
                # Download button
                csv = result['data'].to_csv(index=False)
                st.download_button(
                    "📥 Download Data (CSV)",
                    csv,
                    file_name=f"trackerwave_{domain_name.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )
            
            # Suggestions
            if result.get('suggestions'):
                st.markdown("### 💡 Follow-up Suggestions")
                suggestion_cols = st.columns(2)
                
                for i, suggestion in enumerate(result['suggestions'][:4]):
                    col_idx = i % 2
                    with suggestion_cols[col_idx]:
                        if st.button(suggestion, key=f"suggestion_{i}", use_container_width=True):
                            st.session_state.main_query_input = suggestion
                            st.rerun()
            
            # Technical details
            with st.expander("🔧 Technical Details", expanded=False):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.write(f"**Query Type:** {result['intent'].get('query_type', 'Unknown')}")
                    st.write(f"**Chart Type:** {result['intent'].get('requested_chart_type', 'auto')}")
                    st.write(f"**Primary Table:** {result['intent'].get('primary_table', 'Unknown')}")
                
                with col2:
                    st.write(f"**AI Explanation:** {result['explanation']}")
                    if st.toggle("Show Generated SQL", key="show_sql"):
                        st.code(result['sql'], language='sql')
        
        else:
            # Error handling
            st.markdown(f"""
            <div class="status-error">
                <strong>❌ Query Failed:</strong> {result['summary']}
            </div>
            """, unsafe_allow_html=True)
            
            if 'error' in result:
                with st.expander("Error Details", expanded=True):
                    st.error(result['error'])
                    if 'sql' in result:
                        st.code(result['sql'], language='sql')
            
            # Alternative suggestions
            if result.get('suggestions'):
                st.markdown("### 🔄 Try These Instead:")
                for i, suggestion in enumerate(result['suggestions'][:3]):
                    if st.button(suggestion, key=f"error_suggestion_{i}", use_container_width=True):
                        st.session_state.main_query_input = suggestion
                        st.rerun()
    
    # Display persistent results
    elif 'last_result' in st.session_state and st.session_state.last_result['success']:
        result = st.session_state.last_result
        domain_name = result.get('data_domain', 'porter').title()
        
        st.markdown(f"""
        <div class="status-success">
            <strong>📋 Previous {domain_name} Analytics Results</strong><br>
            {result['summary']}
        </div>
        """, unsafe_allow_html=True)
        
        if not result['data'].empty:
            st.markdown("### 📊 Data Results")
            st.dataframe(result['data'], use_container_width=True, hide_index=True)
            
            if result['chart'] is not None:
                st.markdown("### 📈 Data Visualization")
                st.plotly_chart(result['chart'], use_container_width=True)
    
    elif analyze_button:
        st.warning("⚠️ Please enter a query!")
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; padding: 20px;">
        <strong>TrackerWave Analytics</strong><br>
        <small>Porter Request Management • Asset Management • AI-Powered Insights</small>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()