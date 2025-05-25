'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Grid,
  Button,
  OutlinedInput,
  SelectChangeEvent,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { FilterList, Clear, CalendarToday, Person, Phone, Schedule } from '@mui/icons-material';
import { useStore } from '../stores/StoreProvider';

interface Filters {
  dateRange?: { start: string; end: string };
  agents?: string[];
  callTypes?: string[];
  timeRanges?: string[];
}

interface FilterPanelProps {
  onFiltersChange: (filters: Filters) => void;
  selectedAgents: string[];
  selectedCallTypes: string[];
  selectedTimeRanges: string[];
  onAgentsChange: (agents: string[]) => void;
  onCallTypesChange: (callTypes: string[]) => void;
  onTimeRangesChange: (timeRanges: string[]) => void;
  currentFilters?: Filters;
}

const timeRangeOptions = [
  'short',   // < 2 minutes
  'medium',  // 2-5 minutes
  'long',    // > 5 minutes
];

const timeRangeLabels: { [key: string]: string } = {
  'short': 'Short Calls (< 2 min)',
  'medium': 'Medium Calls (2-5 min)',
  'long': 'Long Calls (> 5 min)',
};

export default function FilterPanel({ onFiltersChange, selectedAgents, selectedCallTypes, selectedTimeRanges, onAgentsChange, onCallTypesChange, onTimeRangesChange, currentFilters }: FilterPanelProps) {
  const store = useStore();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  
  const hasInitialized = useRef(false);

  // Get available options from store
  const availableAgents = store.availableAgents;
  const availableCallTypes = store.availableCallTypes;

  // Calculate date range from conversations
  const dateRange = React.useMemo(() => {
    if (store.conversations.length === 0) return null;
    
    const timestamps = store.conversations.map(conv => conv.startTime);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    return {
      min: dayjs(minTime).format('YYYY-MM-DD'),
      max: dayjs(maxTime).format('YYYY-MM-DD'),
    };
  }, [store.conversations]);

  // Sync date pickers with current filters from parent (always keep them in sync)
  useEffect(() => {
    if (currentFilters?.dateRange) {
      const start = dayjs(currentFilters.dateRange.start);
      const end = dayjs(currentFilters.dateRange.end);
      setStartDate(start);
      setEndDate(end);
    }
  }, [currentFilters?.dateRange]);

  // Initialize dates and send initial filters when date range is available
  useEffect(() => {
    if (dateRange && !hasInitialized.current && !currentFilters?.dateRange && store.conversations.length > 0) {
      hasInitialized.current = true;
      
      const start = dayjs(dateRange.min);
      const end = dayjs(dateRange.max);
      
      // Send initial filters with full date range
      const initialFilters: Filters = {
        dateRange: {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        }
      };
      onFiltersChange(initialFilters);
    }
  }, [dateRange, currentFilters?.dateRange, store.conversations.length]);

  const handleAgentChange = (event: SelectChangeEvent<typeof selectedAgents>) => {
    const value = event.target.value;
    const newAgents = typeof value === 'string' ? value.split(',') : value;
    onAgentsChange(newAgents);
    
    // Build filters with the new agents value
    if (startDate && endDate) {
      const filters: Filters = {
        dateRange: {
          start: startDate.format('YYYY-MM-DD'),
          end: endDate.format('YYYY-MM-DD'),
        }
      };
      
      if (newAgents.length > 0) {
        filters.agents = newAgents;
      }
      
      if (selectedCallTypes.length > 0) {
        filters.callTypes = selectedCallTypes;
      }
      
      if (selectedTimeRanges.length > 0) {
        filters.timeRanges = selectedTimeRanges;
      }
      
      onFiltersChange(filters);
    }
  };

  const handleCallTypeChange = (event: SelectChangeEvent<typeof selectedCallTypes>) => {
    const value = event.target.value;
    const newCallTypes = typeof value === 'string' ? value.split(',') : value;
    onCallTypesChange(newCallTypes);
    
    // Build filters with the new call types value
    if (startDate && endDate) {
      const filters: Filters = {
        dateRange: {
          start: startDate.format('YYYY-MM-DD'),
          end: endDate.format('YYYY-MM-DD'),
        }
      };
      
      if (selectedAgents.length > 0) {
        filters.agents = selectedAgents;
      }
      
      if (newCallTypes.length > 0) {
        filters.callTypes = newCallTypes;
      }
      
      if (selectedTimeRanges.length > 0) {
        filters.timeRanges = selectedTimeRanges;
      }
      
      onFiltersChange(filters);
    }
  };

  const handleTimeRangeChange = (event: SelectChangeEvent<typeof selectedTimeRanges>) => {
    const value = event.target.value;
    const newTimeRanges = typeof value === 'string' ? value.split(',') : value;
    onTimeRangesChange(newTimeRanges);
    
    // Build filters with the new time ranges value
    if (startDate && endDate) {
      const filters: Filters = {
        dateRange: {
          start: startDate.format('YYYY-MM-DD'),
          end: endDate.format('YYYY-MM-DD'),
        }
      };
      
      if (selectedAgents.length > 0) {
        filters.agents = selectedAgents;
      }
      
      if (selectedCallTypes.length > 0) {
        filters.callTypes = selectedCallTypes;
      }
      
      if (newTimeRanges.length > 0) {
        filters.timeRanges = newTimeRanges;
      }
      
      onFiltersChange(filters);
    }
  };

  const handleDateChange = (newStartDate: Dayjs | null, newEndDate: Dayjs | null) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    if (newStartDate && newEndDate) {
      const filters: Filters = {
        dateRange: {
          start: newStartDate.format('YYYY-MM-DD'),
          end: newEndDate.format('YYYY-MM-DD'),
        }
      };
      
      if (selectedAgents.length > 0) {
        filters.agents = selectedAgents;
      }
      
      if (selectedCallTypes.length > 0) {
        filters.callTypes = selectedCallTypes;
      }
      
      if (selectedTimeRanges.length > 0) {
        filters.timeRanges = selectedTimeRanges;
      }
      
      onFiltersChange(filters);
    }
  };

  const clearAllFilters = () => {
    // Reset to full date range
    if (dateRange) {
      const start = dayjs(dateRange.min);
      const end = dayjs(dateRange.max);
      setStartDate(start);
      setEndDate(end);
      
      onAgentsChange([]);
      onCallTypesChange([]);
      onTimeRangesChange([]);
      
      const filters: Filters = {
        dateRange: {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        }
      };
      
      onFiltersChange(filters);
    }
  };

  const hasActiveFilters = selectedAgents.length > 0 || selectedCallTypes.length > 0 || selectedTimeRanges.length > 0;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <FilterList sx={{ mr: 1, color: '#90caf9' }} />
        <Typography variant="h6" fontWeight="bold">
          Filters
        </Typography>
        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Clear />}
            onClick={clearAllFilters}
            sx={{ 
              ml: 'auto',
              borderColor: '#ce93d8',
              color: '#ce93d8',
              '&:hover': {
                borderColor: '#ab47bc',
                backgroundColor: 'rgba(206, 147, 216, 0.1)',
              }
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Date Range */}
        <Grid item xs={12} md={6}>
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarToday sx={{ mr: 1, color: '#90caf9', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Date Range
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => handleDateChange(newValue, endDate)}
                  minDate={dateRange ? dayjs(dateRange.min) : undefined}
                  maxDate={dateRange ? dayjs(dateRange.max) : undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => handleDateChange(startDate, newValue)}
                  minDate={startDate || (dateRange ? dayjs(dateRange.min) : undefined)}
                  maxDate={dateRange ? dayjs(dateRange.max) : undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Agents */}
        <Grid item xs={12} md={6}>
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <Person sx={{ mr: 1, color: '#66bb6a', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Agents
              </Typography>
              {selectedAgents.length > 0 && (
                <Chip 
                  label={selectedAgents.length} 
                  size="small" 
                  sx={{ 
                    ml: 1, 
                    backgroundColor: '#66bb6a', 
                    color: 'white',
                    minWidth: '24px',
                    height: '20px',
                    fontSize: '0.75rem'
                  }} 
                />
              )}
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Select Agents</InputLabel>
              <Select
                multiple
                value={selectedAgents}
                onChange={handleAgentChange}
                input={<OutlinedInput label="Select Agents" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        sx={{ 
                          backgroundColor: '#66bb6a20',
                          color: '#66bb6a',
                          border: '1px solid #66bb6a40'
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableAgents.map((agent) => (
                  <MenuItem key={agent} value={agent}>
                    {agent}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>

        {/* Call Types */}
        <Grid item xs={12} md={6}>
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <Phone sx={{ mr: 1, color: '#29b6f6', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Call Types
              </Typography>
              {selectedCallTypes.length > 0 && (
                <Chip 
                  label={selectedCallTypes.length} 
                  size="small" 
                  sx={{ 
                    ml: 1, 
                    backgroundColor: '#29b6f6', 
                    color: 'white',
                    minWidth: '24px',
                    height: '20px',
                    fontSize: '0.75rem'
                  }} 
                />
              )}
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Select Call Types</InputLabel>
              <Select
                multiple
                value={selectedCallTypes}
                onChange={handleCallTypeChange}
                input={<OutlinedInput label="Select Call Types" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={value.charAt(0).toUpperCase() + value.slice(1)} 
                        size="small"
                        sx={{ 
                          backgroundColor: '#29b6f620',
                          color: '#29b6f6',
                          border: '1px solid #29b6f640'
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableCallTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>

        {/* Time Ranges */}
        <Grid item xs={12} md={6}>
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <Schedule sx={{ mr: 1, color: '#ffa726', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Call Duration
              </Typography>
              {selectedTimeRanges.length > 0 && (
                <Chip 
                  label={selectedTimeRanges.length} 
                  size="small" 
                  sx={{ 
                    ml: 1, 
                    backgroundColor: '#ffa726', 
                    color: 'white',
                    minWidth: '24px',
                    height: '20px',
                    fontSize: '0.75rem'
                  }} 
                />
              )}
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Select Duration Ranges</InputLabel>
              <Select
                multiple
                value={selectedTimeRanges}
                onChange={handleTimeRangeChange}
                input={<OutlinedInput label="Select Duration Ranges" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={timeRangeLabels[value]} 
                        size="small"
                        sx={{ 
                          backgroundColor: '#ffa72620',
                          color: '#ffa726',
                          border: '1px solid #ffa72640'
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {timeRangeOptions.map((range) => (
                  <MenuItem key={range} value={range}>
                    {timeRangeLabels[range]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 