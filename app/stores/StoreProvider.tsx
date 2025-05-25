'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { conversationStore, IConversationStore } from './ConversationStore';

const StoreContext = createContext<IConversationStore | null>(null);

export const StoreProvider = observer(({ children }: { children: ReactNode }) => {
  return (
    <StoreContext.Provider value={conversationStore}>
      {children}
    </StoreContext.Provider>
  );
});

export const useStore = (): IConversationStore => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
};

export default StoreProvider; 