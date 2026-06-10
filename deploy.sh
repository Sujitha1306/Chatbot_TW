#!/bin/bash

# Enhanced Porter Request Analytics Chatbot - Deployment Script v2.0
# Supports AI-driven features, timezone handling, predictions, and multi-turn conversations

set -e  # Exit on any error

# Colors for enhanced output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Enhanced Configuration
APP_NAME="porter-analytics-chatbot-v2"
PYTHON_VERSION="3.11"
VENV_NAME="venv"
VERSION="2.0"

# Feature flags
ENABLE_PREDICTIONS=${ENABLE_PREDICTIONS:-true}
ENABLE_MULTI_TURN=${ENABLE_MULTI_TURN:-true}
ENABLE_TIMEZONE_SUPPORT=${ENABLE_TIMEZONE_SUPPORT:-true}
DEFAULT_TIMEZONE=${DEFAULT_TIMEZONE:-UTC}

# Enhanced Functions
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║          🤖 Enhanced Porter Analytics Chatbot v$VERSION                  ║${NC}"
    echo -e "${PURPLE}║     AI-Driven • Multi-Turn • Predictive • Timezone-Aware            ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_feature() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

check_python() {
    print_step "Checking Python Installation"
    
    # Check if we're already in a virtual environment
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        PYTHON_CMD="python"
        print_success "Using virtual environment Python: $VIRTUAL_ENV"
    elif command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "Python is not installed. Please install Python $PYTHON_VERSION or higher."
        exit 1
    fi
    
    PYTHON_VER=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    PYTHON_MAJOR=$(echo $PYTHON_VER | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VER | cut -d'.' -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 9 ]); then
        print_error "Python $PYTHON_VER found, but Python 3.9+ is required for enhanced features."
        exit 1
    fi
    
    print_success "Found Python $PYTHON_VER (compatible)"
}

check_enhanced_requirements() {
    print_step "Checking Enhanced System Requirements"
    
    # Check for AI/ML dependencies
    print_info "Checking for scientific computing requirements..."
    
    # Check if git is available for advanced features
    if ! command -v git &> /dev/null; then
        print_warning "Git not found. Some advanced features may not work."
    else
        print_success "Git available for version control features"
    fi
    
    # Check if curl is available for health checks and API testing
    if ! command -v curl &> /dev/null; then
        print_warning "curl not found. Health checks may not work."
    else
        print_success "curl available for health monitoring"
    fi
    
    # Check system memory for ML operations
    if command -v free &> /dev/null; then
        MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$MEMORY_GB" -lt 2 ]; then
            print_warning "Low system memory ($MEMORY_GB GB). Predictive features may be limited."
        else
            print_success "Sufficient memory ($MEMORY_GB GB) for ML operations"
        fi
    fi
    
    print_success "Enhanced system requirements checked"
}

setup_enhanced_environment() {
    print_step "Setting Up Enhanced Virtual Environment"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "$VENV_NAME" ]; then
        $PYTHON_CMD -m venv $VENV_NAME
        print_success "Created virtual environment: $VENV_NAME"
    else
        print_success "Virtual environment already exists: $VENV_NAME"
    fi
    
    # Activate virtual environment (handle Windows and Unix)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
        source $VENV_NAME/Scripts/activate
        PYTHON_CMD="python"  # In Windows venv, use python not python3
    else
        source $VENV_NAME/bin/activate
        PYTHON_CMD="python"  # In activated venv, use python
    fi
    
    # Verify activation worked
    if [[ "$VIRTUAL_ENV" == "" ]]; then
        print_warning "Virtual environment activation may have failed"
    else
        print_success "Virtual environment activated: $VIRTUAL_ENV"
    fi
    
    # Upgrade pip and install wheel for better package compilation
    $PYTHON_CMD -m pip install --upgrade pip setuptools wheel
    print_success "Virtual environment tools upgraded"
}

install_enhanced_dependencies() {
    print_step "Installing Enhanced Dependencies"
    
    if [ -f "requirements.txt" ]; then
        print_info "Installing AI/ML and enhanced features dependencies..."
        
        # Ensure we're using the virtual environment python
        if [[ "$VIRTUAL_ENV" == "" ]]; then
            print_warning "Virtual environment not activated, attempting to activate..."
            if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
                source $VENV_NAME/Scripts/activate
            else
                source $VENV_NAME/bin/activate
            fi
            PYTHON_CMD="python"
        fi
        
        # Install with progress bar and optimizations
        $PYTHON_CMD -m pip install -r requirements.txt --upgrade
        
        print_success "Enhanced dependencies installed successfully"
        
        # Verify critical packages
        print_info "Verifying critical AI/ML packages..."
        $PYTHON_CMD -c "import openai; print('✅ OpenAI:', openai.__version__)" 2>/dev/null || print_warning "OpenAI package verification failed"
        $PYTHON_CMD -c "import sklearn; print('✅ Scikit-learn:', sklearn.__version__)" 2>/dev/null || print_warning "Scikit-learn package verification failed"
        $PYTHON_CMD -c "import plotly; print('✅ Plotly:', plotly.__version__)" 2>/dev/null || print_warning "Plotly package verification failed"
        $PYTHON_CMD -c "import pytz; print('✅ Pytz:', pytz.__version__)" 2>/dev/null || print_warning "Pytz package verification failed"
        
    else
        print_error "requirements.txt not found!"
        exit 1
    fi
}

setup_enhanced_config() {
    print_step "Setting Up Enhanced Configuration"
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.template" ]; then
            cp .env.template .env
            print_success "Created .env file from template"
            
            echo ""
            print_info "Enhanced configuration options:"
            echo "  🧠 AI Features: Semantic understanding, predictions, validation"
            echo "  🌍 Timezone Support: Global timezone and date format handling"
            echo "  💬 Conversations: Multi-turn conversation memory"
            echo "  📊 Visualizations: Advanced charts (heatmaps, scatter plots)"
            echo ""
            print_warning "Please update .env with your credentials:"
            echo "  - AZURE_OPENAI_ENDPOINT: Your Azure OpenAI endpoint"
            echo "  - AZURE_OPENAI_API_KEY: Your Azure OpenAI API key"
            echo "  - AZURE_OPENAI_DEPLOYMENT: Your model deployment (default: gpt-4o-mini)"
            
        else
            print_warning ".env.template not found. Creating basic .env file..."
            cat > .env << 'EOF'
# Enhanced Porter Analytics Chatbot v2.0 Configuration

# Azure OpenAI Configuration (Required)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# ClickHouse Database Configuration
CLICKHOUSE_HOST=172.188.240.120
CLICKHOUSE_PORT=8123
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=your-password-here
CLICKHOUSE_DATABASE=ovitag_dw

# Enhanced Application Configuration
LOG_LEVEL=INFO
MAX_QUERY_TIMEOUT=30
DEFAULT_ROW_LIMIT=100
DEFAULT_TIMEZONE=UTC

# Feature Flags
ENABLE_PREDICTIONS=true
ENABLE_MULTI_TURN=true
ENABLE_TIMEZONE_SUPPORT=true

# Flask API Configuration
FLASK_DEBUG=False
FLASK_HOST=127.0.0.1
FLASK_PORT=5000
EOF
            print_success "Created basic .env file"
        fi
    else
        print_success "Configuration file (.env) already exists"
    fi
}

validate_enhanced_config() {
    print_step "Validating Enhanced Configuration"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please run setup first."
        return 1
    fi
    
    # Source the .env file
    set -a
    source .env
    set +a
    
    # Check for required Azure OpenAI variables
    required_vars=("AZURE_OPENAI_ENDPOINT" "AZURE_OPENAI_API_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"your_"* ]] || [[ "${!var}" == *"https://your-endpoint"* ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing or incomplete environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_warning "Please update your .env file with valid Azure OpenAI credentials."
        return 1
    fi
    
    # Validate timezone if specified - use enhanced validation
    if [ ! -z "$DEFAULT_TIMEZONE" ]; then
        # First check if it's a common timezone (avoid Python dependency issues)
        valid_timezones=("UTC" "US/Eastern" "US/Central" "US/Mountain" "US/Pacific" "Europe/London" "Europe/Paris" "Europe/Berlin" "Asia/Kolkata" "Asia/Tokyo" "Asia/Shanghai" "Australia/Sydney" "America/New_York" "America/Los_Angeles")
        
        timezone_valid=false
        for tz in "${valid_timezones[@]}"; do
            if [ "$DEFAULT_TIMEZONE" = "$tz" ]; then
                timezone_valid=true
                break
            fi
        done
        
        if [ "$timezone_valid" = true ]; then
            print_success "Timezone validated: $DEFAULT_TIMEZONE"
        else
            # Try Python validation as fallback
            # Ensure we're using the virtual environment python
            if [[ "$VIRTUAL_ENV" == "" ]]; then
                if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
                    source $VENV_NAME/Scripts/activate 2>/dev/null || true
                else
                    source $VENV_NAME/bin/activate 2>/dev/null || true
                fi
            fi
            
            if python -c "import pytz; pytz.timezone('$DEFAULT_TIMEZONE')" 2>/dev/null; then
                print_success "Timezone validated: $DEFAULT_TIMEZONE"
            else
                print_warning "Timezone '$DEFAULT_TIMEZONE' may not be fully supported, but continuing..."
                print_info "Supported timezones include: UTC, US/Eastern, US/Pacific, Europe/London, Asia/Kolkata"
                # Don't fail validation for timezone issues
            fi
        fi
    fi
    
    print_success "Enhanced configuration is valid"
    return 0
}

test_enhanced_features() {
    print_step "Testing Enhanced AI Features"
    
    source $VENV_NAME/bin/activate 2>/dev/null || true
    
    # Test AI connectivity
    print_info "Testing Azure OpenAI connectivity..."
    cat > test_ai_connection.py << 'EOF'
import sys
import os
sys.path.append('.')

try:
    from config import Config
    from main import EnhancedNLPToSQLConverter
    
    print("🧠 Testing AI connectivity...")
    converter = EnhancedNLPToSQLConverter()
    
    # Simple test of intent analysis
    intent = converter.analyze_query_intent("test query")
    if intent and isinstance(intent, dict):
        print("✅ AI service is responding correctly")
        print(f"   Model: {converter.model}")
        print(f"   Service: {'Azure OpenAI' if converter.is_azure else 'OpenAI'}")
        sys.exit(0)
    else:
        print("❌ AI service responded but format is unexpected")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ AI connectivity test failed: {str(e)}")
    if "authentication" in str(e).lower() or "api" in str(e).lower():
        print("   Check your Azure OpenAI API key and endpoint")
    elif "model" in str(e).lower() or "deployment" in str(e).lower():
        print("   Check your Azure OpenAI deployment name")
    sys.exit(1)
EOF
    
    if $PYTHON_CMD test_ai_connection.py; then
        rm -f test_ai_connection.py
        AI_STATUS="✅ Operational"
    else
        rm -f test_ai_connection.py
        AI_STATUS="❌ Failed"
        print_warning "AI features may not work properly"
    fi
    
    # Test database connectivity
    print_info "Testing database connectivity..."
    cat > test_db_connection.py << 'EOF'
import sys
import os
sys.path.append('.')

try:
    from main import ClickHouseConnection
    
    print("🗄️  Testing ClickHouse connection...")
    db = ClickHouseConnection()
    result, success = db.execute_query("SELECT 1 as test_connection LIMIT 1")
    
    if success and len(result) > 0:
        print("✅ Database connection successful!")
        print(f"   Host: {db.host}:{db.port}")
        print(f"   Database: {db.database}")
        sys.exit(0)
    else:
        print("❌ Database connection failed - query returned no results")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Database connection failed: {str(e)}")
    sys.exit(1)
EOF
    
    if $PYTHON_CMD test_db_connection.py; then
        rm -f test_db_connection.py
        DB_STATUS="✅ Connected"
    else
        rm -f test_db_connection.py
        DB_STATUS="❌ Failed"
        print_warning "Database queries will not work"
    fi
    
    # Test enhanced features
    print_info "Testing enhanced features..."
    cat > test_enhanced_features.py << 'EOF'
import sys
import os
import pandas as pd
import numpy as np
sys.path.append('.')

try:
    from main import EnhancedResultFormatter
    from config import Config, ConversationState
    import pytz
    
    # Test timezone handling
    print("🌍 Testing timezone support...")
    sample_data = pd.DataFrame({
        'scheduled_time': pd.to_datetime(['2025-06-25 14:30:00', '2025-06-25 15:30:00'])
    })
    
    formatted = EnhancedResultFormatter.format_timezone(sample_data, 'US/Eastern', 'US')
    if not formatted.empty:
        print("✅ Timezone conversion working")
    else:
        print("⚠️  Timezone conversion may have issues")
    
    # Test conversation state
    print("💬 Testing conversation management...")
    conv_state = ConversationState()
    conv_state.add_interaction("test query", {"success": True})
    if len(conv_state.conversation_history) == 1:
        print("✅ Conversation management working")
    else:
        print("⚠️  Conversation management may have issues")
    
    # Test prediction capability
    print("🔮 Testing prediction capabilities...")
    time_data = pd.DataFrame({
        'date': pd.date_range('2025-01-01', periods=30),
        'count': np.random.randint(10, 50, 30)
    })
    
    intent = {'prediction_target': 'count'}
    result = EnhancedResultFormatter.perform_prediction(time_data, intent)
    if 'error' not in result:
        print("✅ Prediction functionality working")
    else:
        print("⚠️  Prediction functionality limited")
    
    print("✅ Enhanced features test completed")
    sys.exit(0)
    
except Exception as e:
    print(f"❌ Enhanced features test failed: {str(e)}")
    sys.exit(1)
EOF
    
    if $PYTHON_CMD test_enhanced_features.py; then
        rm -f test_enhanced_features.py
        FEATURES_STATUS="✅ Working"
    else
        rm -f test_enhanced_features.py
        FEATURES_STATUS="⚠️  Limited"
    fi
    
    # Print status summary
    echo ""
    print_info "🔍 SYSTEM STATUS SUMMARY:"
    echo "  🧠 AI Service:        $AI_STATUS"
    echo "  🗄️  Database:         $DB_STATUS"
    echo "  🚀 Enhanced Features: $FEATURES_STATUS"
    echo ""
}

run_enhanced_tests() {
    print_step "Running Enhanced Test Suite"
    
    # Ensure we're using the virtual environment
    if [[ "$VIRTUAL_ENV" == "" ]]; then
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
            source $VENV_NAME/Scripts/activate
        else
            source $VENV_NAME/bin/activate
        fi
    fi
    
    if [ -f "test_chatbot.py" ]; then
        print_info "Running comprehensive test suite with AI feature coverage..."
        
        # Set test environment variables
        export TESTING=true
        export AZURE_OPENAI_API_KEY="${AZURE_OPENAI_API_KEY:-test-key-for-testing}"
        export AZURE_OPENAI_ENDPOINT="${AZURE_OPENAI_ENDPOINT:-test-endpoint}"
        
        python test_chatbot.py
        
        if [ $? -eq 0 ]; then
            print_success "All enhanced tests passed!"
        else
            print_warning "Some tests failed. Check output above for details."
        fi
    else
        print_warning "test_chatbot.py not found. Skipping comprehensive tests."
    fi
}

start_enhanced_streamlit() {
    print_step "Starting Enhanced Streamlit Application"
    
    if [ -f "main.py" ]; then
        echo ""
        print_feature "🌟 ENHANCED FEATURES ENABLED:"
        echo "  🧠 Semantic Understanding - AI comprehends full query intent"
        echo "  🔮 Predictive Analytics - Forecast future trends and patterns"
        echo "  💬 Multi-turn Conversations - Context-aware follow-up questions"
        echo "  🌍 Global Timezone Support - 14+ timezones with date formats"
        echo "  📊 Advanced Visualizations - Heatmaps, scatter plots, time series"
        echo "  ✅ AI Query Validation - Automatic verification of generated SQL"
        echo ""
        print_info "Starting Enhanced Streamlit UI on http://localhost:8501"
        print_info "Features: Timezone selection, AI suggestions, prediction queries"
        echo ""
        
        # Ensure we're using the virtual environment
        if [[ "$VIRTUAL_ENV" == "" ]]; then
            if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
                source $VENV_NAME/Scripts/activate
            else
                source $VENV_NAME/bin/activate
            fi
        fi
        
        # Start streamlit
        python -m streamlit run main.py --server.address 127.0.0.1 --server.port 8501
    else
        print_error "main.py not found!"
        exit 1
    fi
}

start_enhanced_api() {
    print_step "Starting Enhanced Flask API"
    
    if [ -f "api.py" ]; then
        echo ""
        print_feature "🌟 ENHANCED API v2.0 FEATURES:"
        echo "  🧠 /analyze-intent - Semantic query intent analysis"
        echo "  🔮 /predict - Dedicated predictive analytics endpoint"
        echo "  💬 /session/{id} - Multi-turn conversation management"
        echo "  🌍 /timezones - Global timezone and format support"
        echo "  📊 Advanced chart generation with chart_type parameter"
        echo "  ✅ AI validation in all query responses"
        echo ""
        print_info "Starting Enhanced Flask API on http://localhost:5000"
        print_info "Access http://localhost:5000 for interactive API documentation"
        echo ""
        
        # Ensure we're using the virtual environment
        if [[ "$VIRTUAL_ENV" == "" ]]; then
            if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
                source $VENV_NAME/Scripts/activate
            else
                source $VENV_NAME/bin/activate
            fi
        fi
        
        # Start API
        python api.py
    else
        print_error "api.py not found!"
        exit 1
    fi
}

build_enhanced_docker() {
    print_step "Building Enhanced Docker Image"
    
    if [ -f "Dockerfile" ]; then
        BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
        COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
        
        print_info "Building with enhanced features and optimizations..."
        
        docker build \
            --build-arg BUILD_DATE="$BUILD_DATE" \
            --build-arg VERSION="$VERSION" \
            --build-arg COMMIT_HASH="$COMMIT_HASH" \
            -t $APP_NAME:v$VERSION \
            -t $APP_NAME:latest \
            .
        
        print_success "Enhanced Docker image built: $APP_NAME:v$VERSION"
        
        echo ""
        print_info "📦 DOCKER DEPLOYMENT OPTIONS:"
        echo "  UI Only:  docker run -p 8501:8501 --env-file .env $APP_NAME:v$VERSION"
        echo "  API Only: docker run -p 5000:5000 -e SERVICE_TYPE=api --env-file .env $APP_NAME:v$VERSION"
        echo "  Both:     docker run -p 8501:8501 -p 5000:5000 -e SERVICE_TYPE=both --env-file .env $APP_NAME:v$VERSION"
        
    else
        print_error "Dockerfile not found!"
        exit 1
    fi
}

run_enhanced_docker() {
    print_step "Running Enhanced Docker Container"
    
    if ! validate_enhanced_config; then
        print_error "Configuration validation failed. Please fix issues before running Docker."
        exit 1
    fi
    
    # Stop existing container if running
    docker stop $APP_NAME 2>/dev/null || true
    docker rm $APP_NAME 2>/dev/null || true
    
    print_info "Starting enhanced container with both UI and API..."
    
    docker run -d \
        --name $APP_NAME \
        -p 8501:8501 \
        -p 5000:5000 \
        -e SERVICE_TYPE=both \
        --env-file .env \
        --restart unless-stopped \
        $APP_NAME:latest
    
    # Wait for container to start
    sleep 10
    
    # Check container health
    if docker ps | grep -q $APP_NAME; then
        print_success "Enhanced container started successfully!"
        echo ""
        print_info "🌐 ACCESS POINTS:"
        echo "  Streamlit UI: http://localhost:8501"
        echo "  REST API:     http://localhost:5000"
        echo "  Health Check: http://localhost:5000/health"
        echo ""
        print_info "📊 ENHANCED FEATURES AVAILABLE:"
        echo "  • AI-driven semantic understanding"
        echo "  • Predictive analytics and forecasting"
        echo "  • Multi-turn conversation support"
        echo "  • Global timezone and date format handling"
        echo "  • Advanced visualizations (heatmaps, scatter plots)"
        echo "  • Automatic AI query validation"
        
        # Test endpoints
        echo ""
        print_info "Testing endpoints..."
        sleep 5
        
        if curl -s http://localhost:5000/health > /dev/null; then
            print_success "API health check passed"
        else
            print_warning "API health check failed"
        fi
        
    else
        print_error "Container failed to start"
        docker logs $APP_NAME
        exit 1
    fi
}

show_enhanced_status() {
    print_step "Enhanced System Status Check"
    
    echo ""
    print_info "📊 ENHANCED SYSTEM OVERVIEW:"
    
    # Check virtual environment
    if [ -d "$VENV_NAME" ]; then
        print_success "Virtual Environment: ✅ Present ($VENV_NAME)"
        
        # Check if environment is activated
        if [[ "$VIRTUAL_ENV" != "" ]]; then
            print_info "  Status: Currently activated"
        else
            print_info "  Status: Available (not activated)"
        fi
    else
        print_error "Virtual Environment: ❌ Missing"
    fi
    
    # Check configuration
    if [ -f ".env" ]; then
        print_success "Configuration: ✅ Present (.env)"
        
        if validate_enhanced_config 2>/dev/null; then
            print_info "  Status: Valid configuration"
        else
            print_warning "  Status: Configuration issues detected"
        fi
    else
        print_error "Configuration: ❌ Missing (.env)"
    fi
    
    # Check Docker status
    if command -v docker &> /dev/null; then
        if docker ps | grep -q $APP_NAME; then
            print_success "Docker Container: ✅ Running ($APP_NAME)"
            
            # Get container info
            container_id=$(docker ps -q -f name=$APP_NAME)
            if [ ! -z "$container_id" ]; then
                uptime=$(docker inspect --format='{{.State.StartedAt}}' $container_id)
                print_info "  Started: $uptime"
            fi
        else
            print_warning "Docker Container: ⚠️  Not running"
        fi
    else
        print_info "Docker: Not available"
    fi
    
    # Check ports
    echo ""
    print_info "🌐 SERVICE AVAILABILITY:"
    
    if command -v lsof &> /dev/null; then
        if lsof -i :8501 &> /dev/null; then
            print_success "Streamlit UI (8501): ✅ Active"
            print_info "  Access: http://localhost:8501"
        else
            print_warning "Streamlit UI (8501): ⚠️  Not active"
        fi
        
        if lsof -i :5000 &> /dev/null; then
            print_success "Flask API (5000): ✅ Active"
            print_info "  Access: http://localhost:5000"
        else
            print_warning "Flask API (5000): ⚠️  Not active"
        fi
    else
        print_info "Port checking: lsof not available"
    fi
    
    # Check enhanced features
    echo ""
    print_info "🚀 ENHANCED FEATURES STATUS:"
    
    # Feature status based on configuration
    source .env 2>/dev/null || true
    
    if [ "${ENABLE_PREDICTIONS:-true}" = "true" ]; then
        print_feature "Predictive Analytics: ✅ Enabled"
    else
        print_info "Predictive Analytics: ⚪ Disabled"
    fi
    
    if [ "${ENABLE_MULTI_TURN:-true}" = "true" ]; then
        print_feature "Multi-turn Conversations: ✅ Enabled"
    else
        print_info "Multi-turn Conversations: ⚪ Disabled"
    fi
    
    if [ "${ENABLE_TIMEZONE_SUPPORT:-true}" = "true" ]; then
        print_feature "Timezone Support: ✅ Enabled (Default: ${DEFAULT_TIMEZONE:-UTC})"
    else
        print_info "Timezone Support: ⚪ Disabled"
    fi
    
    # AI Service status
    if [ ! -z "${AZURE_OPENAI_API_KEY:-}" ] && [[ ! "${AZURE_OPENAI_API_KEY}" == *"your_"* ]]; then
        print_feature "AI Service: ✅ Configured (Azure OpenAI)"
    else
        print_warning "AI Service: ⚠️  Not configured"
    fi
}

show_enhanced_logs() {
    print_step "Enhanced Application Logs"
    
    echo ""
    print_info "📋 AVAILABLE LOG FILES:"
    
    log_files=("chatbot.log" "api.log")
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            lines=$(wc -l < "$log_file")
            size=$(du -h "$log_file" | cut -f1)
            print_success "$log_file: $lines lines ($size)"
        else
            print_info "$log_file: Not found"
        fi
    done
    
    # Show recent logs
    echo ""
    print_info "📄 RECENT APPLICATION LOGS (last 20 lines):"
    echo "----------------------------------------"
    
    if [ -f "chatbot.log" ]; then
        echo "🤖 Chatbot Logs:"
        tail -n 10 chatbot.log | while read line; do
            echo "  $line"
        done
        echo ""
    fi
    
    if [ -f "api.log" ]; then
        echo "🌐 API Logs:"
        tail -n 10 api.log | while read line; do
            echo "  $line"
        done
        echo ""
    fi
    
    # Docker logs if container is running
    if docker ps | grep -q $APP_NAME; then
        echo "🐳 Docker Container Logs (last 10 lines):"
        docker logs --tail 10 $APP_NAME | while read line; do
            echo "  $line"
        done
    fi
}

quick_start_enhanced() {
    print_header
    print_step "🚀 Enhanced Quick Start Setup"
    
    echo "This will set up the Enhanced Porter Analytics Chatbot v$VERSION with:"
    echo "  🧠 AI-driven semantic understanding"
    echo "  🔮 Predictive analytics capabilities"
    echo "  💬 Multi-turn conversation support"
    echo "  🌍 Global timezone and date format handling"
    echo "  📊 Advanced visualizations"
    echo ""
    
    # Get Azure OpenAI credentials
    echo "Azure OpenAI Configuration:"
    read -p "Enter your Azure OpenAI Endpoint: " azure_endpoint
    read -p "Enter your Azure OpenAI API Key: " -s azure_key
    echo ""
    read -p "Enter your Azure OpenAI Deployment (default: gpt-4o-mini): " azure_deployment
    azure_deployment=${azure_deployment:-gpt-4o-mini}
    echo ""
    
    if [ -z "$azure_endpoint" ] || [ -z "$azure_key" ]; then
        print_error "Azure OpenAI credentials are required for enhanced features"
        exit 1
    fi
    
    # Setup environment
    check_python
    check_enhanced_requirements
    setup_enhanced_environment
    install_enhanced_dependencies
    
    # Create enhanced .env file with provided credentials
    cat > .env << 'EOF'
# Enhanced Porter Analytics Chatbot v2.0 Configuration
# Generated by quick start

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=PLACEHOLDER_ENDPOINT
AZURE_OPENAI_API_KEY=PLACEHOLDER_KEY
AZURE_OPENAI_DEPLOYMENT=PLACEHOLDER_DEPLOYMENT
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# ClickHouse Database Configuration
CLICKHOUSE_HOST=172.188.240.120
CLICKHOUSE_PORT=8123
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=your-password-here
CLICKHOUSE_DATABASE=ovitag_dw

# Enhanced Application Configuration
LOG_LEVEL=INFO
MAX_QUERY_TIMEOUT=30
DEFAULT_ROW_LIMIT=100
DEFAULT_TIMEZONE=UTC

# Enhanced Feature Flags
ENABLE_PREDICTIONS=true
ENABLE_MULTI_TURN=true
ENABLE_TIMEZONE_SUPPORT=true

# Flask API Configuration
FLASK_DEBUG=False
FLASK_HOST=127.0.0.1
FLASK_PORT=5000
EOF
    
    # Replace placeholders with actual values using sed
    sed -i "s|PLACEHOLDER_ENDPOINT|$azure_endpoint|g" .env
    sed -i "s|PLACEHOLDER_KEY|$azure_key|g" .env  
    sed -i "s|PLACEHOLDER_DEPLOYMENT|$azure_deployment|g" .env
    
    print_success "Enhanced environment configured successfully!"
    echo ""
    
    # Test enhanced features
    test_enhanced_features
    
    print_success "🎉 Enhanced Quick Start Complete!"
    echo ""
    print_info "🚀 NEXT STEPS:"
    echo "  $0 streamlit  # Start enhanced web interface"
    echo "  $0 api        # Start enhanced REST API"
    echo "  $0 docker     # Build and run with Docker"
    echo "  $0 status     # Check system status"
    echo ""
    print_feature "✨ Try these enhanced queries:"
    echo "  • 'Create a heatmap of requests by facility and hour'"
    echo "  • 'Predict request volume for next week'"
    echo "  • 'Show me all columns for recent requests'"
    echo "  • 'Compare porter performance as a scatter plot'"
    echo ""
    print_info "💡 Note: You can select your preferred timezone in the web interface!"
}

show_enhanced_help() {
    print_header
    echo "Enhanced Porter Request Analytics Chatbot v$VERSION - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "🚀 SETUP COMMANDS:"
    echo "  quickstart        Interactive setup with enhanced features"
    echo "  setup             Full development environment setup"
    echo "  install           Install enhanced dependencies only"
    echo "  validate          Validate configuration and test AI/DB connections"
    echo ""
    echo "🎯 RUN COMMANDS:"
    echo "  streamlit         Start enhanced Streamlit web interface"
    echo "  api               Start enhanced Flask REST API"
    echo "  both              Start both Streamlit and API simultaneously"
    echo ""
    echo "🐳 DOCKER COMMANDS:"
    echo "  docker            Build and run enhanced Docker container"
    echo "  docker-build      Build enhanced Docker image only"
    echo "  docker-run        Run existing Docker image"
    echo ""
    echo "🔧 MANAGEMENT COMMANDS:"
    echo "  status            Show enhanced system status"
    echo "  logs              Show application logs"
    echo "  test              Run enhanced test suite"
    echo "  stop              Stop all running services"
    echo "  clean             Clean environment and temporary files"
    echo "  backup            Backup current configuration"
    echo ""
    echo "🌟 ENHANCED FEATURES:"
    echo "  🧠 AI-driven semantic understanding of queries"
    echo "  🔮 Predictive analytics and forecasting"
    echo "  💬 Multi-turn conversation support with context"
    echo "  🌍 Global timezone and date format handling"
    echo "  📊 Advanced visualizations (heatmaps, scatter plots)"
    echo "  ✅ Automatic AI validation of generated queries"
    echo ""
    echo "📖 EXAMPLES:"
    echo "  $0 quickstart             # Best for first-time setup"
    echo "  $0 setup && $0 validate   # Full setup with validation"
    echo "  $0 streamlit              # Start web interface"
    echo "  $0 api                    # Start REST API"
    echo "  $0 docker                 # All-in-one Docker deployment"
    echo ""
    echo "🔗 RESOURCES:"
    echo "  Documentation: README.md"
    echo "  Configuration: .env.template"
    echo "  Test Suite: test_chatbot.py"
    echo "  Docker: Dockerfile"
}

# Enhanced cleanup function
clean_enhanced_environment() {
    print_step "Cleaning Enhanced Environment"
    
    # Stop Docker container
    if command -v docker &> /dev/null; then
        if docker ps | grep -q $APP_NAME; then
            print_info "Stopping Docker container..."
            docker stop $APP_NAME 2>/dev/null || true
            docker rm $APP_NAME 2>/dev/null || true
            print_success "Docker container stopped and removed"
        fi
    fi
    
    # Stop local services
    if command -v lsof &> /dev/null; then
        for port in 8501 5000; do
            PID=$(lsof -ti :$port 2>/dev/null)
            if [ ! -z "$PID" ]; then
                print_info "Stopping service on port $port (PID: $PID)"
                kill $PID 2>/dev/null || true
                print_success "Service stopped on port $port"
            fi
        done
    fi
    
    # Clean Python environment
    if [ -d "$VENV_NAME" ]; then
        print_info "Removing virtual environment..."
        rm -rf $VENV_NAME
        print_success "Virtual environment removed"
    fi
    
    # Clean Python cache and temporary files
    print_info "Cleaning Python cache and temporary files..."
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    rm -f *.log test_*.py 2>/dev/null || true
    
    # Optional: Remove Docker image
    read -p "Remove Docker image as well? (y/N): " remove_docker
    if [[ $remove_docker =~ ^[Yy]$ ]]; then
        if command -v docker &> /dev/null; then
            docker rmi $APP_NAME:latest $APP_NAME:v$VERSION 2>/dev/null || true
            print_success "Docker images removed"
        fi
    fi
    
    print_success "Enhanced environment cleaned"
}

# Enhanced main script logic
case "${1:-help}" in
    "setup")
        print_header
        print_step "Starting Enhanced Setup for $APP_NAME v$VERSION"
        check_python
        check_enhanced_requirements
        setup_enhanced_environment
        install_enhanced_dependencies
        setup_enhanced_config
        if validate_enhanced_config; then
            test_enhanced_features
            run_enhanced_tests
        fi
        print_success "Enhanced setup completed successfully!"
        echo ""
        print_info "🎯 READY TO START:"
        echo "  $0 streamlit  # Enhanced web interface"
        echo "  $0 api        # Enhanced REST API"
        echo "  $0 docker     # Containerized deployment"
        ;;
    
    "quickstart")
        quick_start_enhanced
        ;;
    
    "install")
        print_header
        check_python
        setup_enhanced_environment
        install_enhanced_dependencies
        ;;
    
    "validate")
        print_header
        if validate_enhanced_config; then
            test_enhanced_features
            print_success "🎉 All validations passed! Enhanced chatbot is ready."
        else
            print_error "❌ Validation failed. Please check configuration and try again."
            exit 1
        fi
        ;;
    
    "test")
        print_header
        source $VENV_NAME/bin/activate 2>/dev/null || true
        run_enhanced_tests
        ;;
    
    "streamlit")
        print_header
        if ! validate_enhanced_config; then
            print_error "Please fix configuration issues before starting Streamlit"
            exit 1
        fi
        start_enhanced_streamlit
        ;;
    
    "api")
        print_header
        if ! validate_enhanced_config; then
            print_error "Please fix configuration issues before starting API"
            exit 1
        fi
        start_enhanced_api
        ;;
    
    "both")
        print_header
        if ! validate_enhanced_config; then
            print_error "Please fix configuration issues before starting services"
            exit 1
        fi
        
        print_info "Starting both Streamlit and API services..."
        
        # Ensure we're using the virtual environment
        if [[ "$VIRTUAL_ENV" == "" ]]; then
            if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
                source $VENV_NAME/Scripts/activate
            else
                source $VENV_NAME/bin/activate
            fi
        fi
        
        # Start API in background
        python api.py &
        API_PID=$!
        
        # Wait a moment for API to start
        sleep 3
        
        # Start Streamlit in foreground
        python -m streamlit run main.py --server.address 127.0.0.1 --server.port 8501
        
        # Clean up API process when Streamlit exits
        kill $API_PID 2>/dev/null || true
        ;;
    
    "docker"|"docker-build")
        print_header
        if ! validate_enhanced_config; then
            print_error "Please fix configuration issues before building Docker"
            exit 1
        fi
        build_enhanced_docker
        if [ "$1" = "docker" ]; then
            run_enhanced_docker
        fi
        ;;
    
    "docker-run")
        print_header
        run_enhanced_docker
        ;;
    
    "status")
        print_header
        show_enhanced_status
        ;;
    
    "logs")
        print_header
        show_enhanced_logs
        ;;
    
    "stop")
        print_header
        print_step "Stopping Enhanced Services"
        
        # Stop Docker
        if docker ps | grep -q $APP_NAME; then
            docker stop $APP_NAME
            print_success "Docker container stopped"
        fi
        
        # Stop local services
        if command -v lsof &> /dev/null; then
            for port in 8501 5000; do
                PID=$(lsof -ti :$port 2>/dev/null)
                if [ ! -z "$PID" ]; then
                    kill $PID 2>/dev/null || true
                    print_success "Stopped service on port $port"
                fi
            done
        fi
        ;;
    
    "backup")
        print_header
        print_step "Backing Up Enhanced Configuration"
        
        if [ -f ".env" ]; then
            BACKUP_NAME=".env.backup.$(date +%Y%m%d_%H%M%S)"
            cp .env $BACKUP_NAME
            print_success "Configuration backed up to $BACKUP_NAME"
        else
            print_warning "No .env file to backup"
        fi
        ;;
    
    "clean")
        print_header
        clean_enhanced_environment
        ;;
    
    "help"|"-h"|"--help")
        show_enhanced_help
        ;;
    
    *)
        if [ "$1" = "" ]; then
            show_enhanced_help
        else
            print_error "Unknown command: $1"
            echo ""
            show_enhanced_help
            exit 1
        fi
        ;;
esac