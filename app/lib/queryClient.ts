import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      networkMode: 'always', // This allows us to show cached data when offline
    },
  },
});

// Create a persister
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'MOVIE_APP_QUERY_CACHE',
}); 