'use client';

import React, { useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
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
import { useStore } from './stores/StoreProvider';

interface Filters {
  dateRange?: { start: string; end: string };
  agents?: string[];
  callTypes?: string[];
  timeRanges?: string[];
}

const Dashboard = observer(() => {
  const store = useStore();
  const [agentModalOpen, setAgentModalOpen] = React.useState(false);

  // Load conversations on mount
  useEffect(() => {
    store.loadConversations();
  }, [store]);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    // Update store filters based on new filters
    if (newFilters.dateRange) {
      store.setDateRange(newFilters.dateRange.start, newFilters.dateRange.end);
    } else {
      store.setDateRange();
    }
    
    if (newFilters.agents) {
      store.setAgents(newFilters.agents);
    }
    
    if (newFilters.callTypes) {
      store.setCallTypes(newFilters.callTypes);
    }
    
    if (newFilters.timeRanges) {
      store.setTimeRanges(newFilters.timeRanges);
    }
  }, [store]);

  const handleAgentsChange = useCallback((agents: string[]) => {
    store.setAgents(agents);
  }, [store]);

  const handleCallTypesChange = useCallback((callTypes: string[]) => {
    store.setCallTypes(callTypes);
  }, [store]);

  const handleTimeRangesChange = useCallback((timeRanges: string[]) => {
    store.setTimeRanges(timeRanges);
  }, [store]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
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
    format?: 'number' | 'currency' | 'percentage' | 'time' | 'ms' | 'custom' | 'integer';
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
          return `${val.toFixed(0)}ms`;
        case 'integer':
          return Math.round(val).toString();
        default:
          return typeof val === 'number' ? val.toFixed(2) : val;
      }
    };

    const getProgressColor = () => {
      if (format === 'percentage') {
        if (typeof value === 'number') {
          if (value >= 80) return 'success';
          if (value >= 60) return 'warning';
          return 'error';
        }
      }
      return color;
    };

    const getCardColors = () => {
      const colors = {
        primary: { bg: 'rgba(144, 202, 249, 0.1)', border: '#90caf9' },
        secondary: { bg: 'rgba(206, 147, 216, 0.1)', border: '#ce93d8' },
        success: { bg: 'rgba(102, 187, 106, 0.1)', border: '#66bb6a' },
        error: { bg: 'rgba(244, 67, 54, 0.1)', border: '#f44336' },
        warning: { bg: 'rgba(255, 167, 38, 0.1)', border: '#ffa726' },
        info: { bg: 'rgba(41, 182, 246, 0.1)', border: '#29b6f6' },
      };
      return colors[color] || colors.primary;
    };

    const cardColors = getCardColors();

    return (
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${cardColors.bg} 0%, rgba(30, 30, 30, 0.8) 100%)`,
          border: `1px solid ${cardColors.border}`,
          borderRadius: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px rgba(0,0,0,0.3), 0 0 20px ${cardColors.border}40`,
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box sx={{
              background: `linear-gradient(135deg, ${cardColors.border} 0%, ${cardColors.border}80 100%)`,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${cardColors.border}40`
            }}>
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { fontSize: 28, color: 'white' } 
              })}
            </Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {formatValue(value)}
            </Typography>
          </Box>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          
          {showProgress && typeof progressValue === 'number' && (
            <Box mt={2}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(progressValue, 100)} 
                color={getProgressColor()}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  }
                }}
              />
            </Box>
          )}
          
          {children}
        </CardContent>
      </Card>
    );
  };

  const CallOutcomesCard = ({ metrics }: { metrics: any }) => (
    <Card sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(30, 30, 30, 0.8) 100%)',
      border: '1px solid #66bb6a',
      borderRadius: 2,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.3), 0 0 20px #66bb6a40',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box sx={{
            background: 'linear-gradient(135deg, #66bb6a 0%, #66bb6a80 100%)',
            borderRadius: '50%',
            p: 1.5,
            mr: 2,
            boxShadow: '0 4px 12px #66bb6a40'
          }}>
            <Assessment sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold">Call Outcomes</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <CheckCircle sx={{ color: '#66bb6a', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Success</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="#66bb6a">
                {formatPercentage(metrics.successRate)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <Error sx={{ color: '#f44336', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Failure</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="#f44336">
                {formatPercentage(metrics.failureRate)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <SwapHoriz sx={{ color: '#ffa726', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Transfer</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="#ffa726">
                {formatPercentage(metrics.transferRate)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <Cancel sx={{ color: '#ce93d8', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Abandon</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="#ce93d8">
                {formatPercentage(metrics.abandonmentRate)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const LatencyMetricsCard = ({ metrics }: { metrics: any }) => (
    <Card sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, rgba(41, 182, 246, 0.1) 0%, rgba(30, 30, 30, 0.8) 100%)',
      border: '1px solid #29b6f6',
      borderRadius: 2,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.3), 0 0 20px #29b6f640',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box sx={{
            background: 'linear-gradient(135deg, #29b6f6 0%, #29b6f680 100%)',
            borderRadius: '50%',
            p: 1.5,
            mr: 2,
            boxShadow: '0 4px 12px #29b6f640'
          }}>
            <Speed sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold">Latency Metrics</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center">
                <SignalCellularAlt sx={{ color: '#29b6f6', mr: 1, fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">LLM</Typography>
              </Box>
              <Typography variant="body1" fontWeight="bold">
                {metrics.avgLLMLatency.toFixed(0)}ms
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center">
                <Mic sx={{ color: '#90caf9', mr: 1, fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">TTS</Typography>
              </Box>
              <Typography variant="body1" fontWeight="bold">
                {metrics.avgTTSLatency.toFixed(0)}ms
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Timer sx={{ color: '#ce93d8', mr: 1, fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">Total</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="#ce93d8">
                {metrics.avgTotalLatency.toFixed(0)}ms
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Loading state
  if (store.loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Error state
  if (store.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{store.error}</Alert>
      </Container>
    );
  }

  // No data state
  if (store.conversations.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>No data available</Alert>
      </Container>
    );
  }

  const metrics = store.metrics;

  // Convert store filters to the format expected by FilterPanel
  const currentFilters: Filters = {
    dateRange: store.filters.dateRange ? {
      start: store.filters.dateRange.start,
      end: store.filters.dateRange.end
    } : undefined,
    agents: store.filters.agents.slice(),
    callTypes: store.filters.callTypes.slice(),
    timeRanges: store.filters.timeRanges.slice(),
  };

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
          selectedAgents={store.filters.agents.slice()}
          selectedCallTypes={store.filters.callTypes.slice()}
          selectedTimeRanges={store.filters.timeRanges.slice()}
          onAgentsChange={handleAgentsChange}
          onCallTypesChange={handleCallTypesChange}
          onTimeRangesChange={handleTimeRangesChange}
          currentFilters={currentFilters}
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
              format="integer"
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
        filters={currentFilters}
      />
    </Container>
  );
});

export default Dashboard; 