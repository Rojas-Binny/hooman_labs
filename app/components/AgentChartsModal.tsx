'use client';

import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

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
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open) {
      fetchAgentMetrics();
    }
  }, [open, filters]);

  const fetchAgentMetrics = async () => {
    try {
      setLoading(true);
      
      const queryParams = {};
      if (filters.dateRange) {
        if (filters.dateRange.start) queryParams['dateRange[start]'] = filters.dateRange.start;
        if (filters.dateRange.end) queryParams['dateRange[end]'] = filters.dateRange.end;
      }
      if (filters.agents && filters.agents.length > 0) {
        queryParams['agents'] = filters.agents;
      }
      if (filters.callTypes && filters.callTypes.length > 0) {
        queryParams['callTypes'] = filters.callTypes;
      }
      if (filters.timeRanges && filters.timeRanges.length > 0) {
        queryParams['timeRanges'] = filters.timeRanges;
      }

      const response = await axios.get('http://localhost:3001/api/agent-metrics', { params: queryParams });
      setAgentMetrics(response.data);
    } catch (error) {
      console.error('Error fetching agent metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareBarChartData = (metric: string, label: string) => {
    if (!agentMetrics) return [];
    
    return Object.entries(agentMetrics).map(([agent, metrics]) => ({
      agent: agent.replace('agent_', 'Agent '),
      [label]: Number(metrics[metric as keyof typeof metrics]),
    }));
  };

  const prepareCallOutcomesData = () => {
    if (!agentMetrics) return [];
    
    return Object.entries(agentMetrics).map(([agent, metrics]) => ({
      agent: agent.replace('agent_', 'Agent '),
      'Success Rate': metrics.successRate,
      'Transfer Rate': metrics.transferRate,
      'Abandonment Rate': metrics.abandonmentRate,
      'Failure Rate': metrics.failureRate,
    }));
  };

  const preparePieChartData = () => {
    if (!agentMetrics) return [];
    
    return Object.entries(agentMetrics).map(([agent, metrics], index) => ({
      name: agent.replace('agent_', 'Agent '),
      value: metrics.totalCalls,
      color: COLORS[index % COLORS.length],
    }));
  };

  const prepareLatencyData = () => {
    if (!agentMetrics) return [];
    
    return Object.entries(agentMetrics).map(([agent, metrics]) => ({
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
      ...Object.entries(agentMetrics).map(([agent, metrics]) => [
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
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)',
        color: 'white'
      }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          Agent Performance Analytics
        </Typography>
        <Box>
          <Tooltip title="Download Data">
            <IconButton onClick={downloadChart} sx={{ color: 'white', mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ px: 3 }}
          >
            <Tab label="Call Volume & Performance" />
            <Tab label="Call Outcomes" />
            <Tab label="Cost Analysis" />
            <Tab label="Latency Metrics" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3, minHeight: 600 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
              <Typography>Loading agent analytics...</Typography>
            </Box>
          ) : (
            <>
              {/* Tab 0: Call Volume & Performance */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Total Calls by Agent</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={prepareBarChartData('totalCalls', 'Total Calls')}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="Total Calls" fill="#90caf9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Call Distribution</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={preparePieChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {preparePieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, height: 350 }}>
                      <Typography variant="h6" gutterBottom>Success Rate & Handle Time</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={prepareBarChartData('successRate', 'Success Rate')}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="Success Rate" fill="#66bb6a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Tab 1: Call Outcomes */}
              {tabValue === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, height: 500 }}>
                      <Typography variant="h6" gutterBottom>Call Outcomes by Agent</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={prepareCallOutcomesData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="Success Rate" stackId="a" fill="#66bb6a" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Transfer Rate" stackId="a" fill="#ffa726" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Abandonment Rate" stackId="a" fill="#f44336" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Failure Rate" stackId="a" fill="#9e9e9e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Tab 2: Cost Analysis */}
              {tabValue === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Total Cost by Agent</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={prepareBarChartData('totalCost', 'Total Cost')}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="Total Cost" stroke="#ce93d8" fill="#ce93d8" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Average Cost per Call</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={prepareBarChartData('avgCostPerCall', 'Avg Cost per Call')}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="Avg Cost per Call" fill="#29b6f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, height: 350 }}>
                      <Typography variant="h6" gutterBottom>Cost per Successful Call</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={prepareBarChartData('avgCostPerSuccessfulCall', 'Cost per Success')}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="Cost per Success" 
                            stroke="#90caf9" 
                            strokeWidth={3}
                            dot={{ fill: '#90caf9', r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Tab 3: Latency Metrics */}
              {tabValue === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, height: 500 }}>
                      <Typography variant="h6" gutterBottom>Latency Metrics by Agent</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={prepareLatencyData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="LLM Latency" fill="#29b6f6" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="TTS Latency" fill="#ce93d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, height: 350 }}>
                      <Typography variant="h6" gutterBottom>Average Interruptions per Call</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={prepareBarChartData('avgInterruptions', 'Avg Interruptions')}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agent" />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="Avg Interruptions" fill="#ffa726" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, background: '#1e1e1e' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          Agent performance data with interactive visualizations
        </Typography>
        <Button onClick={onClose} variant="contained" sx={{ 
          background: 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)',
          color: 'black'
        }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 