# Enhanced Porter Request Analytics Chatbot - Multi-Stage Dockerfile
# Stage 1: Base dependencies and build environment
FROM python:3.11-slim as builder

# Set build arguments
ARG BUILD_DATE
ARG VERSION=2.0
ARG COMMIT_HASH=unknown

# Labels for metadata
LABEL maintainer="Porter Analytics Team"
LABEL version="${VERSION}"
LABEL description="Enhanced Porter Request Analytics Chatbot with AI-driven features"
LABEL build-date="${BUILD_DATE}"
LABEL commit-hash="${COMMIT_HASH}"

# Set environment variables for build
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libc6-dev \
    libffi-dev \
    libssl-dev \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create application directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies with optimizations
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Production image
FROM python:3.11-slim as production

# Set production environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STREAMLIT_SERVER_PORT=8501 \
    STREAMLIT_SERVER_ADDRESS=0.0.0.0 \
    FLASK_ENV=production \
    PYTHONPATH=/app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user for security
RUN groupadd -r appgroup && \
    useradd -r -g appgroup -u 1001 appuser && \
    mkdir -p /app /app/logs /app/data && \
    chown -R appuser:appgroup /app

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=appuser:appgroup . .

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/data /app/cache && \
    chown -R appuser:appgroup /app && \
    chmod +x /app/deploy.sh

# Switch to non-root user
USER appuser

# Expose ports for both Streamlit and Flask
EXPOSE 8501 5000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "🚀 Starting Enhanced Porter Analytics Chatbot v2.0"\n\
echo "📊 Features: AI-driven, Multi-turn, Predictive, Timezone-aware"\n\
\n\
# Wait for dependencies\n\
echo "⏳ Checking dependencies..."\n\
sleep 5\n\
\n\
# Start based on SERVICE_TYPE environment variable\n\
if [ "$SERVICE_TYPE" = "api" ]; then\n\
    echo "🌐 Starting Flask API on port 5000"\n\
    exec python api.py\n\
elif [ "$SERVICE_TYPE" = "both" ]; then\n\
    echo "🔄 Starting both Streamlit UI and Flask API"\n\
    python api.py &\n\
    exec streamlit run main.py --server.address 0.0.0.0 --server.port 8501\n\
else\n\
    echo "💻 Starting Streamlit UI on port 8501"\n\
    exec streamlit run main.py --server.address 0.0.0.0 --server.port 8501\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Default command (Streamlit UI)
CMD ["/app/start.sh"]

# Alternative commands for different services:
# For API only: docker run -e SERVICE_TYPE=api <image>
# For both services: docker run -e SERVICE_TYPE=both <image>
# For UI only: docker run <image> (default)

# Production optimization labels
LABEL org.opencontainers.image.source="https://github.com/company/completed-porter-analytics-chatbot"
LABEL org.opencontainers.image.documentation="https://github.com/company/completed-porter-analytics-chatbot/blob/main/README.md"
LABEL org.opencontainers.image.licenses="Proprietary"

# Build example with build args:
# docker build \
#   --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
#   --build-arg VERSION=2.0 \
#   --build-arg COMMIT_HASH=$(git rev-parse HEAD) \
#   -t completed-porter-analytics-chatbot:v2.0 \
#   .

# Multi-service deployment example:
# docker run -d \
#   --name porter-chatbot \
#   -p 8501:8501 \
#   -p 5000:5000 \
#   -e SERVICE_TYPE=both \
#   --env-file .env \
#   completed-porter-analytics-chatbot:v2.0