import { types, Instance, flow, getSnapshot } from 'mobx-state-tree';
import axios from 'axios';

// Call Info Stats Model
const CallStats = types.model('CallStats', {
  llmLatency: types.number,
  ttsLatency: types.number,
  interruptions: types.number,
});

// Call Info Model
const CallInfo = types.model('CallInfo', {
  caller: types.string,
  callee: types.string,
  type: types.enumeration(['inbound', 'outbound']),
  stats: types.maybe(CallStats),
});

// Conversation Model
const Conversation = types.model('Conversation', {
  id: types.identifier,
  agent: types.string,
  startTime: types.number,
  duration: types.number,
  cost: types.number,
  status: types.enumeration(['success', 'dropped', 'transfer', 'busy', 'no_answer']),
  callInfo: CallInfo,
});

// Filters Model
const Filters = types.model('Filters', {
  dateRange: types.maybe(types.model({
    start: types.string,
    end: types.string,
  })),
  agents: types.optional(types.array(types.string), []),
  callTypes: types.optional(types.array(types.string), []),
  timeRanges: types.optional(types.array(types.string), []),
});

// Root Store
const ConversationStore = types
  .model('ConversationStore', {
    conversations: types.array(Conversation),
    filters: types.optional(Filters, {}),
    loading: types.optional(types.boolean, false),
    error: types.maybe(types.string),
  })
  .actions((self) => ({
    // Load conversations from API
    loadConversations: flow(function* () {
      try {
        self.loading = true;
        self.error = undefined;
        const response = yield axios.get('http://localhost:3001/api/conversations');
        self.conversations.clear();
        response.data.forEach((conv: any) => {
          self.conversations.push(conv);
        });
      } catch (error) {
        self.error = `Failed to load conversations: ${error.message}`;
      } finally {
        self.loading = false;
      }
    }),

    // Filter actions
    setDateRange(start?: string, end?: string) {
      if (start && end) {
        self.filters.dateRange = { start, end };
      } else {
        self.filters.dateRange = undefined;
      }
    },

    setAgents(agents: string[]) {
      self.filters.agents.replace(agents);
    },

    setCallTypes(callTypes: string[]) {
      self.filters.callTypes.replace(callTypes);
    },

    setTimeRanges(timeRanges: string[]) {
      self.filters.timeRanges.replace(timeRanges);
    },

    clearFilters() {
      self.filters.dateRange = undefined;
      self.filters.agents.clear();
      self.filters.callTypes.clear();
      self.filters.timeRanges.clear();
    },

    setError(error: string) {
      self.error = error;
    },

    clearError() {
      self.error = undefined;
    },
  }))
  .views((self) => ({
    // Filtered conversations based on current filters
    get filteredConversations() {
      let filtered = self.conversations.slice();

      // Date range filter
      if (self.filters.dateRange) {
        const startTime = new Date(self.filters.dateRange.start).getTime();
        const endTime = new Date(self.filters.dateRange.end).getTime();
        filtered = filtered.filter(conv => 
          conv.startTime >= startTime && conv.startTime <= endTime
        );
      }

      // Agent filter
      if (self.filters.agents.length > 0) {
        filtered = filtered.filter(conv => 
          self.filters.agents.includes(conv.agent)
        );
      }

      // Call type filter
      if (self.filters.callTypes.length > 0) {
        filtered = filtered.filter(conv => 
          self.filters.callTypes.includes(conv.callInfo.type)
        );
      }

      // Time range filter (based on duration)
      if (self.filters.timeRanges.length > 0) {
        filtered = filtered.filter(conv => {
          const duration = conv.duration;
          return self.filters.timeRanges.some(range => {
            switch (range) {
              case 'short': return duration < 120; // < 2 minutes
              case 'medium': return duration >= 120 && duration < 300; // 2-5 minutes
              case 'long': return duration >= 300; // > 5 minutes
              default: return true;
            }
          });
        });
      }

      return filtered;
    },

    // Metric 1: Average Cost per Call
    get avgCostPerCall() {
      const filtered = this.filteredConversations;
      if (filtered.length === 0) return 0;
      const totalCost = filtered.reduce((sum, conv) => sum + conv.cost, 0);
      return totalCost / filtered.length;
    },

    // Metric 2: Average Cost per Minute
    get avgCostPerMin() {
      const filtered = this.filteredConversations;
      if (filtered.length === 0) return 0;
      const totalCost = filtered.reduce((sum, conv) => sum + conv.cost, 0);
      const totalMinutes = filtered.reduce((sum, conv) => sum + (conv.duration / 60), 0);
      return totalMinutes > 0 ? totalCost / totalMinutes : 0;
    },

    // Metric 3: Success Rate
    get successRate() {
      const filtered = this.filteredConversations;
      if (filtered.length === 0) return 0;
      const successCount = filtered.filter(conv => conv.status === 'success').length;
      return (successCount / filtered.length) * 100;
    },

    // Metric 4: Failure Rate (dropped + no_answer)
    get failureRate() {
      const filtered = this.filteredConversations;
      if (filtered.length === 0) return 0;
      const failureCount = filtered.filter(conv => 
        conv.status === 'dropped' || conv.status === 'no_answer'
      ).length;
      return (failureCount / filtered.length) * 100;
    },

    // Metric 5: Transfer Rate
    get transferRate() {
      const filtered = this.filteredConversations;
      if (filtered.length === 0) return 0;
      const transferCount = filtered.filter(conv => conv.status === 'transfer').length;
      return (transferCount / filtered.length) * 100;
    },

    // Metric 6: Abandonment Rate (busy + no_answer)
    get abandonmentRate() {
      const filtered = this.filteredConversations;
      if (filtered.length === 0) return 0;
      const abandonmentCount = filtered.filter(conv => 
        conv.status === 'busy' || conv.status === 'no_answer'
      ).length;
      return (abandonmentCount / filtered.length) * 100;
    },

    // Metric 7: Average Interruptions per Call
    get avgInterruptions() {
      const filtered = this.filteredConversations.filter(conv => conv.callInfo.stats);
      if (filtered.length === 0) return 0;
      const totalInterruptions = filtered.reduce((sum, conv) => 
        sum + (conv.callInfo.stats?.interruptions || 0), 0
      );
      return totalInterruptions / filtered.length;
    },

    // Additional metrics for completeness
    get avgLLMLatency() {
      const filtered = this.filteredConversations.filter(conv => conv.callInfo.stats);
      if (filtered.length === 0) return 0;
      const totalLatency = filtered.reduce((sum, conv) => 
        sum + (conv.callInfo.stats?.llmLatency || 0), 0
      );
      return totalLatency / filtered.length;
    },

    get avgTTSLatency() {
      const filtered = this.filteredConversations.filter(conv => conv.callInfo.stats);
      if (filtered.length === 0) return 0;
      const totalLatency = filtered.reduce((sum, conv) => 
        sum + (conv.callInfo.stats?.ttsLatency || 0), 0
      );
      return totalLatency / filtered.length;
    },

    get avgTotalLatency() {
      const filtered = this.filteredConversations.filter(conv => conv.callInfo.stats);
      if (filtered.length === 0) return 0;
      const totalLatency = filtered.reduce((sum, conv) => 
        sum + ((conv.callInfo.stats?.llmLatency || 0) + (conv.callInfo.stats?.ttsLatency || 0)), 0
      );
      return totalLatency / filtered.length;
    },

    get firstCallResolutionRate() {
      // Assuming success status means first call resolution
      return this.successRate;
    },

    get avgCostPerSuccessfulCall() {
      const successfulCalls = this.filteredConversations.filter(conv => conv.status === 'success');
      if (successfulCalls.length === 0) return 0;
      const totalCost = successfulCalls.reduce((sum, conv) => sum + conv.cost, 0);
      return totalCost / successfulCalls.length;
    },

    get avgHandleTime() {
      const filtered = this.filteredConversations;
      if (filtered.length === 0) return 0;
      const totalDuration = filtered.reduce((sum, conv) => sum + conv.duration, 0);
      return totalDuration / filtered.length;
    },

    get totalCalls() {
      return this.filteredConversations.length;
    },

    get totalCost() {
      return this.filteredConversations.reduce((sum, conv) => sum + conv.cost, 0);
    },

    // Get all unique agents
    get availableAgents() {
      const agents = new Set(self.conversations.map(conv => conv.agent));
      return Array.from(agents).sort();
    },

    // Get all unique call types
    get availableCallTypes() {
      const types = new Set(self.conversations.map(conv => conv.callInfo.type));
      return Array.from(types);
    },

    // Get metrics object for compatibility with existing UI
    get metrics() {
      return {
        avgCostPerCall: this.avgCostPerCall,
        avgCostPerMin: this.avgCostPerMin,
        successRate: this.successRate,
        failureRate: this.failureRate,
        transferRate: this.transferRate,
        abandonmentRate: this.abandonmentRate,
        avgInterruptions: this.avgInterruptions,
        avgLLMLatency: this.avgLLMLatency,
        avgTTSLatency: this.avgTTSLatency,
        avgTotalLatency: this.avgTotalLatency,
        firstCallResolutionRate: this.firstCallResolutionRate,
        avgCostPerSuccessfulCall: this.avgCostPerSuccessfulCall,
        avgHandleTime: this.avgHandleTime,
        totalCalls: this.totalCalls,
        totalCost: this.totalCost,
      };
    },
  }));

// Type exports
export type IConversationStore = Instance<typeof ConversationStore>;
export type IConversation = Instance<typeof Conversation>;
export type IFilters = Instance<typeof Filters>;

// Create and export store instance
export const conversationStore = ConversationStore.create({
  conversations: [],
  filters: {},
  loading: false,
});

export default ConversationStore; 