'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Close as CloseIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useStore } from '../stores/StoreProvider';

interface Filters {
  dateRange?: { start: string; end: string };
  agents?: string[];
  callTypes?: string[];
  timeRanges?: string[];
}

interface AgentMetrics {
  [agent: string]: {
    avgCostPerCall: number;
    avgCostPerMin: number;
    successRate: number;
    failureRate: number;
    transferRate: number;
    abandonmentRate: number;
    avgInterruptions: number;
    avgLLMLatency: number;
    avgTTSLatency: number;
    avgTotalLatency: number;
    firstCallResolutionRate: number;
    avgCostPerSuccessfulCall: number;
    avgHandleTime: number;
    totalCalls: number;
    totalCost: number;
  };
}

interface AgentChartsModalProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
}

const COLORS = ['#90caf9', '#ce93d8', '#66bb6a', '#ffa726', '#f44336', '#29b6f6'];

export default function AgentChartsModal({ open, onClose, filters }: AgentChartsModalProps) {
  const store = useStore();
  const [tabValue, setTabValue] = useState(0);

  // Calculate agent metrics from store data
  const agentMetrics = useMemo(() => {
    const filteredConversations = store.filteredConversations;
    const agentGroups: { [agent: string]: any[] } = {};
    
    // Group conversations by agent
    filteredConversations.forEach(conv => {
      if (!agentGroups[conv.agent]) {
        agentGroups[conv.agent] = [];
      }
      agentGroups[conv.agent].push(conv);
    });

    // Calculate metrics for each agent
    const metrics: AgentMetrics = {};
    
    Object.entries(agentGroups).forEach(([agent, conversations]) => {
      const totalCalls = conversations.length;
      const totalCost = conversations.reduce((sum, conv) => sum + conv.cost, 0);
      const totalDuration = conversations.reduce((sum, conv) => sum + conv.duration, 0);
      const totalMinutes = conversations.reduce((sum, conv) => sum + (conv.duration / 60), 0);
      
      const successfulCalls = conversations.filter(conv => conv.status === 'success');
      const failedCalls = conversations.filter(conv => conv.status === 'dropped' || conv.status === 'no_answer');
      const transferredCalls = conversations.filter(conv => conv.status === 'transfer');
      const abandonedCalls = conversations.filter(conv => conv.status === 'busy' || conv.status === 'no_answer');
      
      const conversationsWithStats = conversations.filter(conv => conv.callInfo.stats);
      const totalInterruptions = conversationsWithStats.reduce((sum, conv) => sum + (conv.callInfo.stats?.interruptions || 0), 0);
      const totalLLMLatency = conversationsWithStats.reduce((sum, conv) => sum + (conv.callInfo.stats?.llmLatency || 0), 0);
      const totalTTSLatency = conversationsWithStats.reduce((sum, conv) => sum + (conv.callInfo.stats?.ttsLatency || 0), 0);
      
      metrics[agent] = {
        totalCalls,
        totalCost,
        avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
        avgCostPerMin: totalMinutes > 0 ? totalCost / totalMinutes : 0,
        successRate: totalCalls > 0 ? (successfulCalls.length / totalCalls) * 100 : 0,
        failureRate: totalCalls > 0 ? (failedCalls.length / totalCalls) * 100 : 0,
        transferRate: totalCalls > 0 ? (transferredCalls.length / totalCalls) * 100 : 0,
        abandonmentRate: totalCalls > 0 ? (abandonedCalls.length / totalCalls) * 100 : 0,
        avgInterruptions: conversationsWithStats.length > 0 ? totalInterruptions / conversationsWithStats.length : 0,
        avgLLMLatency: conversationsWithStats.length > 0 ? totalLLMLatency / conversationsWithStats.length : 0,
        avgTTSLatency: conversationsWithStats.length > 0 ? totalTTSLatency / conversationsWithStats.length : 0,
        avgTotalLatency: conversationsWithStats.length > 0 ? (totalLLMLatency + totalTTSLatency) / conversationsWithStats.length : 0,
        firstCallResolutionRate: totalCalls > 0 ? (successfulCalls.length / totalCalls) * 100 : 0, // Assuming success = first call resolution
        avgCostPerSuccessfulCall: successfulCalls.length > 0 ? successfulCalls.reduce((sum, conv) => sum + conv.cost, 0) / successfulCalls.length : 0,
        avgHandleTime: totalCalls > 0 ? totalDuration / totalCalls : 0,
      };
    });

    return metrics;
  }, [store.filteredConversations]);

  // Helper function to sort agents numerically
  const getSortedAgentEntries = (metrics: AgentMetrics) => {
    return Object.entries(metrics).sort(([agentA], [agentB]) => {
      const numA = parseInt(agentA.replace('agent_', ''));
      const numB = parseInt(agentB.replace('agent_', ''));
      return numA - numB;
    });
  };

  const prepareBarChartData = (metric: string, label: string) => {
    if (!agentMetrics) return [];
    
    return getSortedAgentEntries(agentMetrics).map(([agent, metrics]) => ({
      agent: agent.replace('agent_', 'Agent '),
      [label]: Number(metrics[metric as keyof typeof metrics]),
    }));
  };

  const prepareCallOutcomesData = () => {
    if (!agentMetrics) return [];
    
    return getSortedAgentEntries(agentMetrics).map(([agent, metrics]) => ({
      agent: agent.replace('agent_', 'Agent '),
      'Success Rate': metrics.successRate,
      'Transfer Rate': metrics.transferRate,
      'Abandonment Rate': metrics.abandonmentRate,
      'Failure Rate': metrics.failureRate,
    }));
  };

  const preparePieChartData = () => {
    if (!agentMetrics) return [];
    
    return getSortedAgentEntries(agentMetrics).map(([agent, metrics], index) => ({
      name: agent.replace('agent_', 'Agent '),
      value: metrics.totalCalls,
      color: COLORS[index % COLORS.length],
    }));
  };

  const prepareLatencyData = () => {
    if (!agentMetrics) return [];
    
    return getSortedAgentEntries(agentMetrics).map(([agent, metrics]) => ({
      agent: agent.replace('agent_', 'Agent '),
      'LLM Latency': metrics.avgLLMLatency,
      'TTS Latency': metrics.avgTTSLatency,
      'Total Latency': metrics.avgTotalLatency,
    }));
  };

  const downloadChart = () => {
    // Simple CSV export functionality
    if (!agentMetrics) return;
    
    const csvContent = [
      ['Agent', 'Total Calls', 'Success Rate (%)', 'Total Cost ($)', 'Avg Cost/Call ($)', 'Handle Time (s)', 'Interruptions', 'LLM Latency (ms)', 'TTS Latency (ms)'],
      ...getSortedAgentEntries(agentMetrics).map(([agent, metrics]) => [
        agent,
        metrics.totalCalls,
        metrics.successRate.toFixed(1),
        metrics.totalCost.toFixed(2),
        metrics.avgCostPerCall.toFixed(2),
        metrics.avgHandleTime,
        metrics.avgInterruptions.toFixed(2),
        metrics.avgLLMLatency,
        metrics.avgTTSLatency,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent_metrics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid #ccc' }}>
          <Typography variant="body2" fontWeight="bold">{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Agent Performance Analytics
          </Typography>
          <Box>
            <Tooltip title="Download Data">
              <IconButton onClick={downloadChart} sx={{ mr: 1 }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Performance Overview" />
            <Tab label="Call Outcomes" />
            <Tab label="Cost Analysis" />
            <Tab label="Latency Metrics" />
          </Tabs>
        </Box>

        {/* Performance Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom>Total Calls by Agent</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={preparePieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {preparePieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid #ccc' }}>
                              <Typography variant="body2" fontWeight="bold">{data.name}</Typography>
                              <Typography variant="body2">Calls: {data.value}</Typography>
                              <Typography variant="body2">Percentage: {((data.value / preparePieChartData().reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</Typography>
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontWeight: 'bold' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom>Success Rate by Agent</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareBarChartData('successRate', 'Success Rate')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="Success Rate" fill="#66bb6a" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom>Average Handle Time by Agent</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prepareBarChartData('avgHandleTime', 'Handle Time')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Handle Time" stroke="#90caf9" fill="#90caf9" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Call Outcomes Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, height: 500 }}>
                <Typography variant="h6" gutterBottom>Call Outcomes by Agent</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareCallOutcomesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Success Rate" stackId="a" fill="#66bb6a" />
                    <Bar dataKey="Transfer Rate" stackId="a" fill="#ffa726" />
                    <Bar dataKey="Abandonment Rate" stackId="a" fill="#ce93d8" />
                    <Bar dataKey="Failure Rate" stackId="a" fill="#f44336" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Cost Analysis Tab */}
        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom>Total Cost by Agent</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareBarChartData('totalCost', 'Total Cost')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="Total Cost" fill="#ce93d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom>Average Cost per Call</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareBarChartData('avgCostPerCall', 'Avg Cost per Call')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Avg Cost per Call" stroke="#90caf9" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom>Cost per Successful Call</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareBarChartData('avgCostPerSuccessfulCall', 'Cost per Success')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="Cost per Success" fill="#29b6f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Latency Metrics Tab */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, height: 500 }}>
                <Typography variant="h6" gutterBottom>Latency Metrics by Agent</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareLatencyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="LLM Latency" fill="#90caf9" />
                    <Bar dataKey="TTS Latency" fill="#ce93d8" />
                    <Bar dataKey="Total Latency" fill="#66bb6a" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom>Average Interruptions</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareBarChartData('avgInterruptions', 'Interruptions')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="Interruptions" fill="#ffa726" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 