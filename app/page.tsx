'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  Phone,
  Timer,
  AttachMoney,
  CheckCircle,
  Error,
  Transform,
  CallEnd,
  Mic,
  Speed,
  People,
  AccessTime,
  CallSplit,
  Cancel,
  SwapHoriz,
  PhoneCallback,
  MonetizationOn,
  Assessment,
  Analytics,
  SignalCellularAlt
} from '@mui/icons-material';
import FilterPanel from './components/FilterPanel';
import AgentChartsModal from './components/AgentChartsModal';

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

interface Filters {
  dateRange?: { start: string; end: string };
  agents?: string[];
  callTypes?: string[];
  timeRanges?: string[];
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  
  // Filter state managed at Dashboard level to prevent resets
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedCallTypes, setSelectedCallTypes] = useState<string[]>([]);
  const [selectedTimeRanges, setSelectedTimeRanges] = useState<string[]>([]);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFiltersRef = useRef<string>('');

  const fetchMetrics = useCallback(async (filtersToUse: Filters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Properly serialize filters for query parameters
      const queryParams = {};
      
      if (filtersToUse.dateRange) {
        if (filtersToUse.dateRange.start) queryParams['dateRange[start]'] = filtersToUse.dateRange.start;
        if (filtersToUse.dateRange.end) queryParams['dateRange[end]'] = filtersToUse.dateRange.end;
      }
      
      if (filtersToUse.agents && filtersToUse.agents.length > 0) {
        queryParams['agents'] = filtersToUse.agents;
      }
      
      if (filtersToUse.callTypes && filtersToUse.callTypes.length > 0) {
        queryParams['callTypes'] = filtersToUse.callTypes;
      }
      
      if (filtersToUse.timeRanges && filtersToUse.timeRanges.length > 0) {
        queryParams['timeRanges'] = filtersToUse.timeRanges;
      }
      
      const response = await axios.get('http://localhost:3001/api/metrics', { params: queryParams });
      setMetrics(response.data);
    } catch (err) {
      setError(`Failed to fetch metrics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced effect for filters
  useEffect(() => {
    const filtersString = JSON.stringify(filters);
    
    // Don't make API call if filters haven't actually changed
    if (lastFiltersRef.current === filtersString) {
      return;
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced API call
    timeoutRef.current = setTimeout(() => {
      lastFiltersRef.current = filtersString;
      fetchMetrics(filters);
    }, 300); // 300ms debounce
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filters]); // Removed fetchMetrics dependency

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleAgentsChange = useCallback((agents: string[]) => {
    setSelectedAgents(agents);
  }, []);

  const handleCallTypesChange = useCallback((callTypes: string[]) => {
    setSelectedCallTypes(callTypes);
  }, []);

  const handleTimeRangesChange = useCallback((timeRanges: string[]) => {
    setSelectedTimeRanges(timeRanges);
  }, []);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const MetricCard = ({
    title,
    value,
    icon,
    color = 'primary',
    format = 'number',
    showProgress = false,
    progressValue,
    children,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    format?: 'number' | 'currency' | 'percentage' | 'time' | 'ms' | 'custom';
    showProgress?: boolean;
    progressValue?: number;
    children?: React.ReactNode;
  }) => {
    const formatValue = (val: number | string) => {
      if (format === 'custom') return val;
      if (typeof val === 'string') return val;
      
      switch (format) {
        case 'currency':
          return formatCurrency(val);
        case 'percentage':
          return formatPercentage(val);
        case 'time':
          return formatTime(val);
        case 'ms':
          return `${val}ms`;
        default:
          return val.toFixed(2);
      }
    };

    const getProgressColor = () => {
      switch (color) {
        case 'success': return '#4caf50';
        case 'error': return '#f44336';
        case 'warning': return '#ff9800';
        case 'secondary': return '#9c27b0';
        case 'info': return '#2196f3';
        default: return '#1976d2';
      }
    };

    const getCardColors = () => {
      // Dark theme colors
      switch (color) {
        case 'success': 
          return {
            background: 'linear-gradient(135deg, #1e3a2e 0%, #2d2d2d 100%)',
            border: '#66bb6a20',
            iconBg: '#66bb6a',
            shadow: '#66bb6a30'
          };
        case 'error': 
          return {
            background: 'linear-gradient(135deg, #3a1e1e 0%, #2d2d2d 100%)',
            border: '#f4433620',
            iconBg: '#f44336',
            shadow: '#f4433630'
          };
        case 'warning': 
          return {
            background: 'linear-gradient(135deg, #3a2e1e 0%, #2d2d2d 100%)',
            border: '#ffa72620',
            iconBg: '#ffa726',
            shadow: '#ffa72630'
          };
        case 'secondary': 
          return {
            background: 'linear-gradient(135deg, #2e1e3a 0%, #2d2d2d 100%)',
            border: '#ce93d820',
            iconBg: '#ce93d8',
            shadow: '#ce93d830'
          };
        case 'info':
          return {
            background: 'linear-gradient(135deg, #1e2e3a 0%, #2d2d2d 100%)',
            border: '#29b6f620',
            iconBg: '#29b6f6',
            shadow: '#29b6f630'
          };
        default: 
          return {
            background: 'linear-gradient(135deg, #1e2e3a 0%, #2d2d2d 100%)',
            border: '#90caf920',
            iconBg: '#90caf9',
            shadow: '#90caf930'
          };
      }
    };

    const cardColors = getCardColors();

    return (
      <Card 
        sx={{ 
          height: '100%', 
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          },
          background: cardColors.background,
          border: `1px solid ${cardColors.border}`
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box sx={{ 
              backgroundColor: cardColors.iconBg,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: `0 4px 12px ${cardColors.shadow}`
            }}>
              {icon}
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight="medium" mb={1}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" color="#90caf9" fontWeight="bold" mb={showProgress ? 2 : 0}>
            {formatValue(value)}
          </Typography>
          {children}
          {showProgress && (
            <Box>
              <LinearProgress 
                variant="determinate" 
                value={progressValue || (typeof value === 'number' ? value : 0)} 
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#333',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getProgressColor(),
                    borderRadius: 3,
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {format === 'percentage' ? `${(progressValue || (typeof value === 'number' ? value : 0)).toFixed(1)}% of total` : 'Performance indicator'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const CallOutcomesCard = ({ metrics }: { metrics: Metrics }) => (
    <MetricCard
      title="Call Outcomes Distribution"
      value=""
      icon={<Analytics />}
      color="primary"
      format="custom"
    >
      <Box sx={{ mt: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <CheckCircle sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">Success</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold" color="#4caf50">
            {formatPercentage(metrics.successRate)}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={metrics.successRate} 
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: '#e8f5e8',
            mb: 1.5,
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#4caf50',
              borderRadius: 2,
            }
          }}
        />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <Transform sx={{ fontSize: 16, color: '#ff9800', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">Transfer</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold" color="#ff9800">
            {formatPercentage(metrics.transferRate)}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={metrics.transferRate} 
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: '#fff3e0',
            mb: 1.5,
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#ff9800',
              borderRadius: 2,
            }
          }}
        />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <CallEnd sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">Abandoned</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold" color="#f44336">
            {formatPercentage(metrics.abandonmentRate)}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={metrics.abandonmentRate} 
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: '#ffebee',
            mb: 1.5,
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#f44336',
              borderRadius: 2,
            }
          }}
        />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <Error sx={{ fontSize: 16, color: '#9e9e9e', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">Failed</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold" color="#9e9e9e">
            {formatPercentage(metrics.failureRate)}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={metrics.failureRate} 
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: '#f5f5f5',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#9e9e9e',
              borderRadius: 2,
            }
          }}
        />
      </Box>
    </MetricCard>
  );

  const LatencyMetricsCard = ({ metrics }: { metrics: Metrics }) => (
    <MetricCard
      title="Latency Metrics"
      value={`${metrics.avgTotalLatency}ms`}
      icon={<Speed />}
      color="info"
      format="custom"
    >
      <Box sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#2196f3', 
              mr: 1 
            }} />
            <Typography variant="body2" color="text.secondary">LLM Latency</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold" color="#2196f3">
            {metrics.avgLLMLatency}ms
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#7b1fa2', 
              mr: 1 
            }} />
            <Typography variant="body2" color="text.secondary">TTS Latency</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold" color="#7b1fa2">
            {metrics.avgTTSLatency}ms
          </Typography>
        </Box>
        
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary">
            Combined Total: {metrics.avgTotalLatency}ms
          </Typography>
        </Box>
      </Box>
    </MetricCard>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2, color: '#90caf9' }} />
          <Typography variant="h6" color="text.secondary">Loading analytics...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!metrics) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>No data available</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box sx={{
            background: 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)',
            borderRadius: '50%',
            p: 1.5,
            mr: 2,
            boxShadow: '0 4px 12px rgba(144, 202, 249, 0.3)'
          }}>
            <DashboardIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h3" component="h1" fontWeight="bold" 
              sx={{ 
                background: 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Hooman Labs
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 0.5 }}>
              Real-time performance insights and metrics
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <FilterPanel 
          onFiltersChange={handleFiltersChange}
          selectedAgents={selectedAgents}
          selectedCallTypes={selectedCallTypes}
          selectedTimeRanges={selectedTimeRanges}
          onAgentsChange={handleAgentsChange}
          onCallTypesChange={handleCallTypesChange}
          onTimeRangesChange={handleTimeRangesChange}
          currentFilters={filters}
        />
      </Paper>

      {/* Summary Cards */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <MetricCard
              title="Total Calls"
              value={metrics.totalCalls}
              icon={<Phone />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MetricCard
              title="Total Cost"
              value={metrics.totalCost}
              icon={<AttachMoney />}
              format="currency"
              color="secondary"
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Main Metrics */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Key Performance Metrics
          </Typography>
          <Button
            variant="contained"
            startIcon={<People />}
            onClick={() => setAgentModalOpen(true)}
            sx={{ 
              px: 3,
              background: 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)',
              color: 'black',
              '&:hover': {
                background: 'linear-gradient(135deg, #42a5f5 0%, #ab47bc 100%)',
              }
            }}
          >
            View Agent Analytics
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Cost Metrics */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Avg Cost per Call"
              value={metrics.avgCostPerCall}
              icon={<AttachMoney />}
              format="currency"
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Avg Cost per Minute"
              value={metrics.avgCostPerMin}
              icon={<Timer />}
              format="currency"
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Avg Cost per Successful Call"
              value={metrics.avgCostPerSuccessfulCall}
              icon={<MonetizationOn />}
              format="currency"
              color="success"
            />
          </Grid>

          {/* Combined Call Outcomes */}
          <Grid item xs={12} sm={6} md={4}>
            <CallOutcomesCard metrics={metrics} />
          </Grid>

          {/* Combined Latency Metrics */}
          <Grid item xs={12} sm={6} md={4}>
            <LatencyMetricsCard metrics={metrics} />
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="First Call Resolution Rate"
              value={metrics.firstCallResolutionRate}
              icon={<TrendingUp />}
              format="percentage"
              color="success"
              showProgress={true}
              progressValue={metrics.firstCallResolutionRate}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Avg Interruptions per Call"
              value={metrics.avgInterruptions}
              icon={<Mic />}
              color="warning"
            />
          </Grid>

          {/* Handle Time */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Avg Handle Time"
              value={metrics.avgHandleTime}
              icon={<AccessTime />}
              format="time"
              color="primary"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Agent Metrics Modal */}
      <AgentChartsModal
        open={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        filters={filters}
      />
    </Container>
  );
} 