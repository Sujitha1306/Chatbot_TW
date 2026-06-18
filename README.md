# 📊 TrackerWave Analytics Platform

## 📑 Summary
The TrackerWave Analytics Platform is a unified, AI-powered conversational chatbot built to seamlessly query, analyze, and visualize data for **Porter Request Management** and **Asset Management**. By leveraging advanced Natural Language Processing (Azure OpenAI) and a blazing-fast columnar database (ClickHouse), users can ask plain English questions about hospital operations, and instantly receive accurate data tables, dynamic charts, and intelligent narrative summaries.

---

## ✨ Features
- **Conversational Interface**: Ask questions naturally in a chat-like interface. Supports follow-up questions and conversational memory.
- **Smart Routing & Domain Detection**: Automatically routes questions to the appropriate domain (Porter operations vs. Asset tracking) or answers general conversational greetings instantly.
- **Automated SQL Generation**: Translates natural language into optimized ClickHouse SQL queries.
- **Dynamic Visualizations**: Automatically recommends the best chart type (Bar, Line, Pie, Scatter) and renders interactive Plotly charts in Angular.
- **Cross-Conversation Context**: "Found in" folder links easily navigate users back to related queries previously asked.
- **Actionable AI Insights**: Beyond raw data, the chatbot provides a human-readable summary of the metrics with actionable insights.
- **Export Functionality**: Easily export data to CSV, Excel, or PDF.

---

## 🏗️ Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│     User Query      │───▶│   Domain Detection   │───▶│  Table Selection │
│  (Natural Language) │    │   (Porter vs Asset)  │    │ (Porter/Asset)  │
└─────────────────────┘    └──────────────────────┘    └─────────────────┘
                                      │                         │
                                      ▼                         ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   TrackerWave UI    │◀───│  Enhanced Results &  │◀───│   ClickHouse    │
│   (Angular & D3)    │    │   AI Insights        │    │    Database     │
└─────────────────────┘    └──────────────────────┘    └─────────────────┘
```

The platform follows a modern separated backend/frontend architecture with real-time streaming capabilities:

1. **Frontend (Angular)**: 
   - A reactive, component-based UI built with Angular and TailwindCSS.
   - Manages state using RxJS and handles Server-Sent Events (SSE) for real-time typewriter-style chat responses.
   - Dynamically renders interactive charts using Plotly.js.

2. **Backend (Python / FastAPI)**:
   - Serves as the core orchestrator. 
   - Exposes REST and SSE endpoints for streaming data.
   - Uses `sql_pipeline.py` to route intents, construct Azure OpenAI prompts, and safely query the database.
   - Stores user session history locally in a JSON store to maintain conversational memory.

3. **Database (ClickHouse)**:
   - High-performance analytical database containing massive volumes of IoT telemetry, Porter Requests, and Asset Tracking data.

---

## 🔄 Workflow

1. **User Query**: The user types a natural language question in the Angular frontend.
2. **Streaming Connection**: Angular establishes an SSE connection to the FastAPI backend.
3. **Memory Retrieval**: The backend looks up the `session_id` to retrieve chat history for context.
4. **AI Pipeline**: 
   - **Router**: Classifies the intent (Conversational vs. Data).
   - **Planner**: Maps the question to the correct database tables.
   - **SQL Generator**: Writes the ClickHouse SQL.
5. **Execution & Analysis**: The backend executes the SQL, gets the rows, and asks the AI to summarize the results.
6. **Streaming Response**: The AI's text, along with the raw data and chart configuration (`chartSpec`), are streamed back to the frontend.
7. **Rendering**: Angular renders the text, data table, and charts in real-time!

---

## 🚀 Getting Started

Follow these steps to clone the repository and get the application running locally.

### 1. Clone the Repository
```bash
git clone https://github.com/Sujitha1306/Chatbot_TW.git
cd Chatbot_TW
```

### 2. Setup and Run the Backend (FastAPI)
The backend is built with Python. We recommend using a virtual environment.

```bash
# Ensure you are in the project root directory
# 1. Create a Python virtual environment
python3 -m venv .venv

# 2. Activate the virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements/base.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your Azure OpenAI keys and ClickHouse credentials

# 5. Start the backend server
./.venv/bin/uvicorn backend.app.main:app --port 8000 --reload
```
The backend API will now be running at `http://localhost:8000`.

### 3. Setup and Run the Frontend (Angular)
The frontend requires Node.js and npm.

```bash
# 1. Open a new terminal window/tab
# 2. Navigate to the frontend directory
cd frontend-angular

# 3. Install NPM dependencies
npm install

# 4. Start the Angular development server
npm start
```
The frontend UI will now be running at `http://localhost:4200`. Open this URL in your browser to start chatting!

---

## 💡 Example Questions & Expected Results

Here are some example prompts you can ask the chatbot to test the system:

### Question 1: Porter Workload
**You ask:** *"What is our porter completion rate by facility?"*
**Expected Result:** 
- The AI will generate a Bar chart showing completed vs. total requests per facility.
- A summary explaining which facilities are performing well and which are falling behind (e.g., "Facility 0009 has a 97% completion rate, but Facility 0039 is struggling at 52%").

### Question 2: Asset Inventory Breakdown
**You ask:** *"Show me the asset status breakdown."*
**Expected Result:** 
- A Pie Chart or Bar Chart showing counts of `ATS-INU`, `ATS-ONB`, `Active`, etc.
- A summary noting that a large percentage of assets might be missing an explicit status.

### Question 3: Time Series Analysis
**You ask:** *"Show porter requests trend over time."*
**Expected Result:** 
- A Line Chart displaying the volume of requests grouped by Month and Year.
- A data table with the exact monthly counts.

### Question 4: Conversational Greeting
**You ask:** *"Hi, what can you do?"*
**Expected Result:** 
- The AI responds instantly without generating a chart or executing SQL. It greets you and explains that it can help analyze Porter and Asset Management data.

### Question 5: Cross-Domain Correlation
**You ask:** *"Compare the number of active critical assets with the number of completed porter requests by facility."*
**Expected Result:** 
- A multi-series Bar Chart with two measures plotted side-by-side per facility.
- A combined summary explaining both the asset count and the porter workload.