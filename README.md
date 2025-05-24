## 🎯 **Project Overview**

This dashboard provides comprehensive analytics Hooman Labs operations, tracking 7 key performance metrics with advanced filtering and visual analytics. Built for scalability and professional deployment with a focus on user experience and data visualization.

### **Key Features**
- 📈 **7 Core Performance Metrics** with real-time calculations
- 🎨 **Professional Dark Theme** with blue/purple gradient design
- 🔍 **Advanced Filtering System** with persistent state management
- 📊 **Interactive Visual Analytics** with 4 chart categories
- 🇮🇳 **Indian Date Format** (DD/MM/YYYY) support
- 📱 **Fully Responsive Design** for all screen sizes
- 💾 **CSV Export Functionality** for data analysis
- ⚡ **Real-time Data Processing** with optimized performance

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Styling**: Material-UI sx prop system + CSS modules
- **Date Handling**: Day.js with MUI Date Pickers
- **Charts**: Recharts for interactive visualizations
- **HTTP Client**: Axios for API communication
- **State Management**: React Hooks with optimized re-rendering

### **Backend Stack**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Port**: 3001
- **Data Processing**: Lodash for advanced data manipulation
- **CORS**: Enabled for cross-origin requests
- **File System**: JSON-based data storage

### **Data Architecture**
- **Primary Dataset**: Mock Data (1).json (500 call records)
- **Package Management**: npm with 525+ packages
- **Development Tools**: ESLint, TypeScript compiler

## 📊 **Core Metrics Dashboard**

### **1. Cost Analytics**
- **Average Cost per Call**: Real-time calculation across all calls
- **Average Cost per Minute**: Duration-based cost analysis
- **Cost per Successful Call**: Success-focused cost optimization

### **2. Performance Rates**
- **Success Rate**: Percentage of successful call completions
- **Failure Rate**: Comprehensive failure tracking including busy calls
- **Transfer Rate**: Call escalation metrics
- **Abandonment Rate**: Customer drop-off analysis

### **3. Quality Metrics**
- **Average Interruptions per Call**: Call quality assessment
- **First Call Resolution Rate**: Customer satisfaction indicator
- **Average Handle Time**: Efficiency measurement

### **4. Latency Analysis**
- **LLM Latency**: Language model response times
- **TTS Latency**: Text-to-speech conversion times
- **Combined Latency**: Total system response metrics

## 🎨 **User Interface Features**

### **Dark Theme Implementation**
- **Background Colors**: #121212 (primary), #1e1e1e (paper)
- **Accent Colors**: Blue (#90caf9) and Purple (#ce93d8) gradients
- **Component Theming**: All Material-UI components consistently themed
- **Accessibility**: Proper contrast ratios and readable typography

### **Advanced Filtering System**
- **Date Range Picker**: Indian format (DD/MM/YYYY) with timezone handling
- **Agent Selection**: Multi-select dropdown with visual chips
- **Call Type Filtering**: Inbound/Outbound categorization
- **Time Range Filtering**: 4 configurable time slots
- **Active Filters Display**: Visual indicator with delete functionality
- **Persistent State**: Filters maintain state across navigation

### **Visual Analytics Modal**
Four interactive chart categories:

1. **Call Volume & Performance**
   - Bar charts for total calls and success rates
   - Pie chart with external labels and connecting lines
   - Agent performance comparison

2. **Call Outcomes Analysis**
   - Stacked bar charts showing outcome distribution
   - Color-coded success/transfer/abandonment/failure rates

3. **Cost Analysis Dashboard**
   - Area charts for cost trends
   - Bar charts for average costs
   - Line charts for cost per successful call

4. **Latency Metrics Visualization**
   - Grouped bar charts for LLM vs TTS latency
   - Interruption frequency analysis

## 🚀 **Installation & Setup**

### **Prerequisites**
- Node.js (v18 or higher)
- npm (v8 or higher)
- Git for version control

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/Rojas-Binny/hooman_labs.git
cd Hooman

# Install dependencies
npm install

# Start the backend server (Terminal 1)
npm run server

# Start the frontend development server (Terminal 2)
npm run dev
```

### **Access Points**
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: See API Endpoints section below

## 🔌 **API Endpoints**

### **Core Metrics**
- `GET /api/metrics` - Main dashboard metrics with filtering support
- `GET /api/agent-metrics` - Agent-wise performance comparison

### **Configuration Data**
- `GET /api/agents` - Available agents list
- `GET /api/call-types` - Available call types (inbound/outbound)
- `GET /api/date-range` - Data date boundaries for filtering

### **Data Access**
- `GET /api/conversations` - Complete call records (500 entries)
- `GET /api/raw-data` - Raw mock data access
- `GET /api/debug-filter` - Filter debugging and validation

