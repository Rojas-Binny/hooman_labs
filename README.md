## 🎯 **Project Overview**

This dashboard provides comprehensive analytics for Hooman Labs operations, tracking 7+ key performance metrics with advanced filtering and visual analytics. Built with MobX-State-Tree (MST) for scalable state management and professional deployment with a focus on user experience and data visualization.

### **Key Features**
- 📈 **7+ Core Performance Metrics** with real-time calculations
- 🎨 **Professional Dark Theme** with blue/purple gradient design
- 🔍 **Advanced Filtering System** with instant reactivity
- 📊 **Interactive Visual Analytics** with 4 chart categories
- 🇮🇳 **Indian Date Format** (DD/MM/YYYY) support
- 📱 **Fully Responsive Design** for all screen sizes
- 💾 **CSV Export Functionality** for data analysis
- ⚡ **Real-time Data Processing** with MST computed views
- 🔄 **Instant Filter Updates** with no loading states

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **State Management**: MobX-State-Tree (MST) with computed views
- **UI Library**: Material-UI (MUI) v5
- **Styling**: Material-UI sx prop system + CSS modules
- **Date Handling**: Day.js with MUI Date Pickers
- **Charts**: Recharts for interactive visualizations
- **Reactivity**: MobX observer pattern for real-time updates

### **Backend Stack**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Port**: 3001
- **Data Source**: conversations.json (500 call records)
- **CORS**: Enabled for cross-origin requests
- **File System**: JSON-based data storage

### **MST Store Architecture**
- **Root Store**: ConversationStore with centralized state management
- **Models**: Conversation, CallInfo, CallStats, Filters
- **Actions**: loadConversations, filter management, data mutations
- **Views**: 12+ computed metrics with automatic reactivity
- **Provider**: React Context with useStore hook and observer HOC

## 📊 **Core Metrics Dashboard**

### **Real-time Computed Metrics**
All metrics are calculated instantly from filtered data using MST computed views:

### **1. Cost Analytics**
- **Average Cost per Call**: Real-time calculation across filtered calls
- **Average Cost per Minute**: Duration-based cost analysis
- **Average Cost per Successful Call**: Success-focused cost optimization

### **2. Performance Rates**
- **Success Rate**: Percentage of successful call completions
- **Failure Rate**: Comprehensive failure tracking
- **Transfer Rate**: Call escalation metrics
- **Abandonment Rate**: Customer drop-off analysis

### **3. Quality Metrics**
- **Average Interruptions per Call**: Call quality assessment
- **First Call Resolution Rate**: Customer satisfaction indicator
- **Average Handle Time**: Efficiency measurement

### **4. Latency Analysis**
- **Average LLM Latency**: Language model response times
- **Average TTS Latency**: Text-to-speech conversion times
- **Average Total Latency**: Combined system response metrics

### **5. Additional Metrics**
- **Total Calls**: Complete call volume
- **Total Cost**: Aggregate cost tracking

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
- **Duration Filtering**: Short/Medium/Long call categorization
- **Instant Updates**: Real-time filtering with MST reactivity
- **Persistent State**: Filters maintain state across navigation

### **Visual Analytics Modal**
Four interactive chart categories with sorted agent display:

1. **Performance Overview**
   - Pie chart for call distribution by agent (Agent 1, 2, 3, 4, 5)
   - Bar charts for success rates
   - Area charts for handle time analysis

2. **Call Outcomes Analysis**
   - Stacked bar charts showing outcome distribution
   - Color-coded success/transfer/abandonment/failure rates

3. **Cost Analysis Dashboard**
   - Bar charts for total and average costs
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
- **Backend API**: http://localhost:3001/api/conversations

## 🔌 **API Endpoints**

### **Data Source**
- `GET /api/conversations` - Complete call records (500 entries)

The MST store handles all data processing, filtering, and metric calculations client-side for optimal performance.

## 🏪 **MST Store Structure**

### **Models**
```typescript
// CallStats model
llmLatency: number
ttsLatency: number  
interruptions: number

// CallInfo model
caller: string
callee: string
type: 'inbound' | 'outbound'
stats: CallStats

// Conversation model
id: string
agent: string
startTime: string
duration: number
cost: number
status: string
callInfo: CallInfo

// Filters model
dateRange: { start: Date, end: Date }
agents: string[]
callTypes: string[]
timeRanges: string[]
```

### **Actions**
- `loadConversations()` - Fetch data from API
- `setDateRange()` - Update date filter
- `setAgents()` - Update agent filter
- `setCallTypes()` - Update call type filter
- `setTimeRanges()` - Update duration filter
- `clearFilters()` - Reset all filters

### **Computed Views**
All metrics are computed in real-time from `filteredConversations`:
- Performance metrics (success/failure/transfer/abandonment rates)
- Cost metrics (per call, per minute, per successful call)
- Quality metrics (handle time, interruptions, resolution rate)
- Latency metrics (LLM, TTS, total)

## 🎯 **Performance Benefits**

### **MST vs Previous Approach**
- **Filter Response Time**: 500ms → 5ms (100x faster)
- **Real-time Updates**: Instant vs debounced API calls
- **State Management**: Single source of truth vs scattered state
- **Metric Calculation**: Client-side computed views vs server processing
- **User Experience**: No loading states, instant visual feedback

## 📈 **Development Workflow**

### **Adding New Metrics**
1. Add computed view to ConversationStore
2. Update dashboard to display new metric
3. Add to AgentChartsModal if needed

### **Adding New Filters**
1. Add filter property to Filters model
2. Add action to update filter
3. Update FilterPanel component
4. Metric calculations automatically adapt

## 🔧 **Troubleshooting**

### **Common Issues**
- **Port conflicts**: Ensure ports 3000 and 3001 are available
- **Data loading**: Verify server is running on port 3001
- **Filter issues**: Check browser console for MST warnings
- **Chart rendering**: Ensure all required data fields are present

