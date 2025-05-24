const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load conversations data from conversations.json
const conversationsPath = path.join(__dirname, '../data/conversations.json');
let conversationsData = [];
try {
  conversationsData = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
  console.log(`Loaded ${conversationsData.length} conversation records from conversations.json`);
} catch (error) {
  console.error('Error loading conversations data:', error);
  console.log('Please ensure conversations.json exists in the data/ directory');
}

// Helper function to filter data based on filters
function filterData(data, filters) {
  let filteredData = [...data];

  // Handle flattened dateRange parameters
  const dateRangeStart = filters['dateRange[start]'] || filters.dateRange?.start;
  const dateRangeEnd = filters['dateRange[end]'] || filters.dateRange?.end;
  
  if (dateRangeStart && dateRangeEnd) {
    const startTime = new Date(dateRangeStart + 'T00:00:00.000Z').getTime();
    const endTime = new Date(dateRangeEnd + 'T23:59:59.999Z').getTime();
    console.log(`Filtering dates from ${startTime} to ${endTime}`);
    console.log(`Date range: ${new Date(startTime)} to ${new Date(endTime)}`);
    
    filteredData = filteredData.filter(call => {
      const callTime = call.startTime;
      const isInRange = callTime >= startTime && callTime <= endTime;
      if (!isInRange) {
        console.log(`Filtered out call ${call.id} with time ${callTime} (${new Date(callTime)})`);
      }
      return isInRange;
    });
    
    console.log(`After date filtering: ${filteredData.length} records`);
  }

  // Handle agents array (can come as array or comma-separated string)
  const agents = filters.agents;
  if (agents && agents.length > 0) {
    const agentArray = Array.isArray(agents) ? agents : [agents];
    filteredData = filteredData.filter(call => 
      agentArray.includes(call.agent)
    );
  }

  // Handle callTypes array
  const callTypes = filters.callTypes;
  if (callTypes && callTypes.length > 0) {
    const callTypeArray = Array.isArray(callTypes) ? callTypes : [callTypes];
    filteredData = filteredData.filter(call => 
      callTypeArray.includes(call.callInfo?.type)
    );
  }

  // Handle timeRanges array
  const timeRanges = filters.timeRanges;
  if (timeRanges && timeRanges.length > 0) {
    const timeRangeArray = Array.isArray(timeRanges) ? timeRanges : [timeRanges];
    filteredData = filteredData.filter(call => {
      const callTime = new Date(call.startTime);
      const hour = callTime.getHours();
      return timeRangeArray.some(range => {
        const [start, end] = range.split('-').map(Number);
        return hour >= start && hour <= end;
      });
    });
  }

  return filteredData;
}

// Calculate metrics
function calculateMetrics(data) {
  const totalCalls = data.length;
  const callsWithDuration = data.filter(call => call.duration > 0);
  const successfulCalls = data.filter(call => call.status === 'success');
  const transferredCalls = data.filter(call => call.status === 'transfer');
  const droppedCalls = data.filter(call => call.status === 'dropped' || call.status === 'no_answer');
  const busyCalls = data.filter(call => call.status === 'busy');
  const callsWithStats = data.filter(call => call.callInfo?.stats);

  // 1. Avg Cost per call/per min
  const totalCost = data.reduce((sum, call) => sum + call.cost, 0);
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
  const totalDuration = callsWithDuration.reduce((sum, call) => sum + call.duration, 0);
  const avgCostPerMin = totalDuration > 0 ? (totalCost / (totalDuration / 60)) : 0;

  // 2. Success Rate, Failure Rate, Transfer Rate, Abandonment Rate
  const successRate = totalCalls > 0 ? (successfulCalls.length / totalCalls) * 100 : 0;
  const transferRate = totalCalls > 0 ? (transferredCalls.length / totalCalls) * 100 : 0;
  const abandonmentRate = totalCalls > 0 ? (droppedCalls.length / totalCalls) * 100 : 0;
  // Failure rate includes busy calls and any other non-success, non-transfer, non-abandoned calls
  const failureRate = totalCalls > 0 ? ((busyCalls.length + (totalCalls - successfulCalls.length - transferredCalls.length - droppedCalls.length)) / totalCalls) * 100 : 0;

  // 3. Avg no. of Interruptions per call
  const totalInterruptions = callsWithStats.reduce((sum, call) => sum + (call.callInfo.stats.interruptions || 0), 0);
  const avgInterruptions = callsWithStats.length > 0 ? totalInterruptions / callsWithStats.length : 0;

  // 4. Avg Latency (LLM + TTS)
  const totalLLMLatency = callsWithStats.reduce((sum, call) => sum + (call.callInfo.stats.llmLatency || 0), 0);
  const totalTTSLatency = callsWithStats.reduce((sum, call) => sum + (call.callInfo.stats.ttsLatency || 0), 0);
  const avgLLMLatency = callsWithStats.length > 0 ? totalLLMLatency / callsWithStats.length : 0;
  const avgTTSLatency = callsWithStats.length > 0 ? totalTTSLatency / callsWithStats.length : 0;
  const avgTotalLatency = avgLLMLatency + avgTTSLatency;

  // 5. First Call Resolution Rate (assuming success = first call resolution)
  const firstCallResolutionRate = successRate;

  // 6. Avg Cost/Successful Call
  const avgCostPerSuccessfulCall = successfulCalls.length > 0 ? 
    successfulCalls.reduce((sum, call) => sum + call.cost, 0) / successfulCalls.length : 0;

  // 7. Avg Handle Time (duration of calls that were answered)
  const avgHandleTime = callsWithDuration.length > 0 ? 
    totalDuration / callsWithDuration.length : 0;

  return {
    avgCostPerCall: Math.round(avgCostPerCall * 100) / 100,
    avgCostPerMin: Math.round(avgCostPerMin * 100) / 100,
    successRate: Math.round(successRate * 10) / 10,
    failureRate: Math.round(failureRate * 10) / 10,
    transferRate: Math.round(transferRate * 10) / 10,
    abandonmentRate: Math.round(abandonmentRate * 10) / 10,
    avgInterruptions: Math.round(avgInterruptions * 100) / 100,
    avgLLMLatency: Math.round(avgLLMLatency),
    avgTTSLatency: Math.round(avgTTSLatency),
    avgTotalLatency: Math.round(avgTotalLatency),
    firstCallResolutionRate: Math.round(firstCallResolutionRate * 10) / 10,
    avgCostPerSuccessfulCall: Math.round(avgCostPerSuccessfulCall * 100) / 100,
    avgHandleTime: Math.round(avgHandleTime),
    totalCalls,
    totalCost: Math.round(totalCost * 100) / 100
  };
}

// Calculate agent-wise metrics
function calculateAgentMetrics(data) {
  const agentGroups = _.groupBy(data, 'agent');
  const agentMetrics = {};

  Object.keys(agentGroups).forEach(agent => {
    agentMetrics[agent] = calculateMetrics(agentGroups[agent]);
  });

  return agentMetrics;
}

// API Routes
app.get('/api/metrics', (req, res) => {
  try {
    const filters = req.query;
    const filteredData = filterData(conversationsData, filters);
    const metrics = calculateMetrics(filteredData);
    res.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

app.get('/api/agent-metrics', (req, res) => {
  try {
    const filters = req.query;
    const filteredData = filterData(conversationsData, filters);
    const agentMetrics = calculateAgentMetrics(filteredData);
    res.json(agentMetrics);
  } catch (error) {
    console.error('Error calculating agent metrics:', error);
    res.status(500).json({ error: 'Failed to calculate agent metrics' });
  }
});

app.get('/api/agents', (req, res) => {
  try {
    const agents = [...new Set(conversationsData.map(call => call.agent))].sort();
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.get('/api/call-types', (req, res) => {
  try {
    const callTypes = [...new Set(conversationsData.map(call => call.callInfo?.type).filter(Boolean))].sort();
    res.json(callTypes);
  } catch (error) {
    console.error('Error fetching call types:', error);
    res.status(500).json({ error: 'Failed to fetch call types' });
  }
});

app.get('/api/date-range', (req, res) => {
  try {
    const timestamps = conversationsData.map(call => call.startTime);
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));
    res.json({
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching date range:', error);
    res.status(500).json({ error: 'Failed to fetch date range' });
  }
});

app.get('/api/conversations', (req, res) => {
  try {
    res.json(conversationsData);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// New endpoint to serve raw conversations data
app.get('/api/raw-data', (req, res) => {
  try {
    console.log(`Raw conversations data contains ${conversationsData.length} records`);
    res.json(conversationsData);
  } catch (error) {
    console.error('Error fetching raw data:', error);
    res.status(500).json({ error: 'Failed to fetch raw data' });
  }
});

// Debug endpoint to check filtering issues
app.get('/api/debug-filter', (req, res) => {
  try {
    const filters = req.query;
    console.log('Received filters:', JSON.stringify(filters));
    const filteredData = filterData(conversationsData, filters);
    console.log(`Original data: ${conversationsData.length} records, Filtered data: ${filteredData.length} records`);
    
    res.json({
      originalCount: conversationsData.length,
      filteredCount: filteredData.length,
      filters: filters,
      sampleRecord: filteredData[0] || null
    });
  } catch (error) {
    console.error('Error in debug filter:', error);
    res.status(500).json({ error: 'Failed to debug filter' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 