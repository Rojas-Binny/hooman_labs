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
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon, Download as DownloadIcon } from '@mui/icons-material';
import axios from 'axios';

interface Metrics {
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
}

interface AgentMetrics {
  [agent: string]: Metrics;
}

interface Filters {
  dateRange?: { start: string; end: string };
  agents?: string[];
  callTypes?: string[];
  timeRanges?: string[];
}

interface AgentMetricsModalProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
}

type SortableKeys = keyof Metrics;

export default function AgentMetricsModal({ open, onClose, filters }: AgentMetricsModalProps) {
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortableKeys>('totalCalls');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (open) {
      fetchAgentMetrics();
    }
  }, [open, filters]);

  const fetchAgentMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3001/api/agent-metrics', { params: filters });
      setAgentMetrics(response.data);
    } catch (err) {
      setError('Failed to fetch agent metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortableKeys) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}m ${seconds}s`;
      case 'ms':
        return `${value}ms`;
      case 'number':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getSortedAgents = () => {
    if (!agentMetrics) return [];
    
    const agents = Object.keys(agentMetrics);
    return agents.sort((a, b) => {
      const aValue = agentMetrics[a][sortBy];
      const bValue = agentMetrics[b][sortBy];
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  const downloadCSV = () => {
    if (!agentMetrics) return;

    const headers = [
      'Agent',
      'Total Calls',
      'Total Cost ($)',
      'Avg Cost per Call ($)',
      'Avg Cost per Min ($)',
      'Success Rate (%)',
      'Failure Rate (%)',
      'Transfer Rate (%)',
      'Abandonment Rate (%)',
      'Avg Interruptions',
      'Avg LLM Latency (ms)',
      'Avg TTS Latency (ms)',
      'Total Latency (ms)',
      'First Call Resolution Rate (%)',
      'Avg Cost per Successful Call ($)',
      'Avg Handle Time (s)',
    ];

    const rows = getSortedAgents().map(agent => {
      const metrics = agentMetrics[agent];
      return [
        agent,
        metrics.totalCalls,
        metrics.totalCost.toFixed(2),
        metrics.avgCostPerCall.toFixed(2),
        metrics.avgCostPerMin.toFixed(2),
        metrics.successRate.toFixed(1),
        metrics.failureRate.toFixed(1),
        metrics.transferRate.toFixed(1),
        metrics.abandonmentRate.toFixed(1),
        metrics.avgInterruptions.toFixed(2),
        metrics.avgLLMLatency,
        metrics.avgTTSLatency,
        metrics.avgTotalLatency,
        metrics.firstCallResolutionRate.toFixed(1),
        metrics.avgCostPerSuccessfulCall.toFixed(2),
        metrics.avgHandleTime,
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'agent-metrics.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: { height: fullScreen ? '100%' : '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight="bold">
            Agent-wise Performance Metrics
          </Typography>
          <Box>
            {agentMetrics && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadCSV}
                sx={{ mr: 1 }}
                size="small"
              >
                Export CSV
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {agentMetrics && !loading && (
          <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    Agent
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'totalCalls'}
                      direction={sortBy === 'totalCalls' ? sortOrder : 'desc'}
                      onClick={() => handleSort('totalCalls')}
                      sx={{ color: 'white !important' }}
                    >
                      Total Calls
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'totalCost'}
                      direction={sortBy === 'totalCost' ? sortOrder : 'desc'}
                      onClick={() => handleSort('totalCost')}
                      sx={{ color: 'white !important' }}
                    >
                      Total Cost
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'avgCostPerCall'}
                      direction={sortBy === 'avgCostPerCall' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avgCostPerCall')}
                      sx={{ color: 'white !important' }}
                    >
                      Avg Cost/Call
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'successRate'}
                      direction={sortBy === 'successRate' ? sortOrder : 'desc'}
                      onClick={() => handleSort('successRate')}
                      sx={{ color: 'white !important' }}
                    >
                      Success Rate
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'transferRate'}
                      direction={sortBy === 'transferRate' ? sortOrder : 'desc'}
                      onClick={() => handleSort('transferRate')}
                      sx={{ color: 'white !important' }}
                    >
                      Transfer Rate
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'avgInterruptions'}
                      direction={sortBy === 'avgInterruptions' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avgInterruptions')}
                      sx={{ color: 'white !important' }}
                    >
                      Avg Interruptions
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'avgTotalLatency'}
                      direction={sortBy === 'avgTotalLatency' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avgTotalLatency')}
                      sx={{ color: 'white !important' }}
                    >
                      Avg Latency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    <TableSortLabel
                      active={sortBy === 'avgHandleTime'}
                      direction={sortBy === 'avgHandleTime' ? sortOrder : 'desc'}
                      onClick={() => handleSort('avgHandleTime')}
                      sx={{ color: 'white !important' }}
                    >
                      Avg Handle Time
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedAgents().map((agent, index) => {
                  const metrics = agentMetrics[agent];
                  return (
                    <TableRow 
                      key={agent}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                        '&:hover': { bgcolor: 'primary.light', opacity: 0.1 }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>{agent}</TableCell>
                      <TableCell>{metrics.totalCalls}</TableCell>
                      <TableCell>{formatValue(metrics.totalCost, 'currency')}</TableCell>
                      <TableCell>{formatValue(metrics.avgCostPerCall, 'currency')}</TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            color: metrics.successRate >= 50 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatValue(metrics.successRate, 'percentage')}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            color: metrics.transferRate <= 20 ? 'success.main' : 'warning.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatValue(metrics.transferRate, 'percentage')}
                        </Box>
                      </TableCell>
                      <TableCell>{formatValue(metrics.avgInterruptions, 'number')}</TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            color: metrics.avgTotalLatency <= 1000 ? 'success.main' : 'warning.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatValue(metrics.avgTotalLatency, 'ms')}
                        </Box>
                      </TableCell>
                      <TableCell>{formatValue(metrics.avgHandleTime, 'time')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 