import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNetwork } from './NetworkContext';
import { useQueryClient } from '@tanstack/react-query';
import { PendingAction } from '../types';
import { toggleFavorite } from './api';

/**
 * SyncManager Component
 * 
 * This component manages the synchronization of offline actions with the server
 * when the device comes back online.
 * 
 * Offline Favorite Management System:
 * 1. When a user toggles a favorite while offline, the action is stored in the 'pendingActions' query data
 * 2. The LikeMoviesScreen uses these pending actions to update the UI even when offline
 * 3. When the network connection is restored, this component processes all pending actions
 * 4. If an action fails, it is put back in the queue to try again later
 * 5. After processing, the relevant queries are invalidated to refresh data from the server
 * 
 * This approach ensures a seamless user experience with immediate UI feedback,
 * regardless of network status, while maintaining data consistency.
 */
export const SyncManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, showOnlineBanner } = useNetwork();
  const queryClient = useQueryClient();

  // Process pending actions when connection is restored
  useEffect(() => {
    if (isConnected && showOnlineBanner) {
      processPendingActions();
    }
  }, [isConnected, showOnlineBanner]);

  const processPendingActions = async () => {
    const pendingActions = queryClient.getQueryData<PendingAction[]>(['pendingActions']) || [];
    
    if (pendingActions.length === 0) {
      return;
    }

    // Create a copy of pending actions to work with
    const actionsToProcess = [...pendingActions];
    // Clear pending actions immediately to prevent duplicate processing
    await queryClient.setQueryData(['pendingActions'], []);
    
    let successCount = 0;
    let failureCount = 0;

    // Process each pending action
    for (const action of actionsToProcess) {
      try {
        if (action.type === 'toggleFavorite') {
          await toggleFavorite(action.movieId, action.status);
          successCount++;
        }
      } catch (error) {
        console.error('Error processing action:', error);
        failureCount++;
        
        // Put the failed action back in the queue
        const currentPendingActions = queryClient.getQueryData<PendingAction[]>(['pendingActions']) || [];
        await queryClient.setQueryData<PendingAction[]>(['pendingActions'], [
          ...currentPendingActions,
          action
        ]);
      }
    }

    // Refresh all favorite-related data
    queryClient.invalidateQueries({ queryKey: ['favoriteMovies'] });
    queryClient.invalidateQueries({ queryKey: ['favoriteStatus'] });
    

    if (successCount > 0 || failureCount > 0) {
      Alert.alert(
        "Sync Complete",
        `${successCount} favorite updates synced successfully.${failureCount > 0 ? `\n${failureCount} updates failed and will retry later.` : ''}`
      );
    }
  };

  return <>{children}</>;
};

export default SyncManager; 