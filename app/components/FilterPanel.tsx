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
import axios from 'axios';
import { FilterList, Clear, CalendarToday, Person, Phone, Schedule } from '@mui/icons-material';

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
  '0-6',   // Early Morning
  '6-12',  // Morning
  '12-18', // Afternoon
  '18-24', // Evening
];

const timeRangeLabels: { [key: string]: string } = {
  '0-6': 'Early Morning (12AM-6AM)',
  '6-12': 'Morning (6AM-12PM)',
  '12-18': 'Afternoon (12PM-6PM)',
  '18-24': 'Evening (6PM-12AM)',
};

export default function FilterPanel({ onFiltersChange, selectedAgents, selectedCallTypes, selectedTimeRanges, onAgentsChange, onCallTypesChange, onTimeRangesChange, currentFilters }: FilterPanelProps) {
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [availableCallTypes, setAvailableCallTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{min: string, max: string} | null>(null);
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

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
    if (dateRange && !hasInitialized.current && !currentFilters?.dateRange) {
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
  }, [dateRange, currentFilters?.dateRange]);

  const fetchMetadata = async () => {
    try {
      const [agentsRes, callTypesRes, dateRangeRes] = await Promise.all([
        axios.get('http://localhost:3001/api/agents'),
        axios.get('http://localhost:3001/api/call-types'),
        axios.get('http://localhost:3001/api/date-range'),
      ]);
      
      setAvailableAgents(agentsRes.data);
      setAvailableCallTypes(callTypesRes.data);
      setDateRange(dateRangeRes.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

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
    // Reset all filter states
    onAgentsChange([]);
    onCallTypesChange([]);
    onTimeRangesChange([]);
    
    // Reset dates to full range and send filters
    if (dateRange) {
      const start = dayjs(dateRange.min);
      const end = dayjs(dateRange.max);
      
      // Send filters with only date range (no other filters)
      onFiltersChange({
        dateRange: {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        }
      });
    }
  };

  const hasActiveFilters = selectedAgents.length > 0 || selectedCallTypes.length > 0 || selectedTimeRanges.length > 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <FilterList sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Filters & Search
            </Typography>
          </Box>
          {hasActiveFilters && (
            <Button 
              startIcon={<Clear />} 
              onClick={clearAllFilters}
              size="small"
              sx={{ 
                color: 'error.main',
                '&:hover': { backgroundColor: 'error.light', color: 'white' }
              }}
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(144, 202, 249, 0.3)' }}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
              Active Filters
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedAgents.map((agent) => (
                <Chip 
                  key={agent} 
                  label={`Agent: ${agent}`} 
                  size="small" 
                  color="primary"
                  onDelete={() => {
                    const newAgents = selectedAgents.filter(a => a !== agent);
                    onAgentsChange(newAgents);
                    
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
                  }}
                />
              ))}
              {selectedCallTypes.map((type) => (
                <Chip 
                  key={type} 
                  label={`Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`} 
                  size="small" 
                  color="secondary"
                  onDelete={() => {
                    const newCallTypes = selectedCallTypes.filter(t => t !== type);
                    onCallTypesChange(newCallTypes);
                    
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
                  }}
                />
              ))}
              {selectedTimeRanges.map((range) => (
                <Chip 
                  key={range} 
                  label={`Time: ${timeRangeLabels[range]}`} 
                  size="small" 
                  color="success"
                  onDelete={() => {
                    const newTimeRanges = selectedTimeRanges.filter(r => r !== range);
                    onTimeRangesChange(newTimeRanges);
                    
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
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* Date Range */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Date Range
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => handleDateChange(newValue, endDate)}
                format="DD/MM/YYYY"
                slotProps={{ 
                  textField: { 
                    id: 'start-date-picker',
                    name: 'startDate',
                    size: 'small', 
                    fullWidth: true 
                  } 
                }}
                minDate={dateRange ? dayjs(dateRange.min) : undefined}
                maxDate={dateRange ? dayjs(dateRange.max) : undefined}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => handleDateChange(startDate, newValue)}
                format="DD/MM/YYYY"
                slotProps={{ 
                  textField: { 
                    id: 'end-date-picker',
                    name: 'endDate',
                    size: 'small', 
                    fullWidth: true 
                  } 
                }}
                minDate={startDate || (dateRange ? dayjs(dateRange.min) : undefined)}
                maxDate={dateRange ? dayjs(dateRange.max) : undefined}
              />
            </Box>
          </Grid>

          {/* Agent Selection */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <Person sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Agents
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel id="agents-select-label" htmlFor="agents-select">Select Agents</InputLabel>
              <Select
                labelId="agents-select-label"
                id="agents-select"
                name="agents"
                multiple
                value={selectedAgents}
                onChange={handleAgentChange}
                input={<OutlinedInput label="Select Agents" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" color="primary" variant="outlined" />
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
          </Grid>

          {/* Call Type */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <Phone sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Call Types
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel id="call-types-select-label" htmlFor="call-types-select">Select Call Types</InputLabel>
              <Select
                labelId="call-types-select-label"
                id="call-types-select"
                name="callTypes"
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
                        color="secondary"
                        variant="outlined"
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
          </Grid>

          {/* Time Ranges */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <Schedule sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Time Ranges
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel id="time-ranges-select-label" htmlFor="time-ranges-select">Select Time Ranges</InputLabel>
              <Select
                labelId="time-ranges-select-label"
                id="time-ranges-select"
                name="timeRanges"
                multiple
                value={selectedTimeRanges}
                onChange={handleTimeRangeChange}
                input={<OutlinedInput label="Select Time Ranges" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={timeRangeLabels[value]} 
                        size="small" 
                        color="success"
                        variant="outlined"
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
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
} 