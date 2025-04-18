import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
  showOnlineBanner: boolean;
}

// Create context with default values
export const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  showOnlineBanner: false,
});

// Custom hook to use the network context
export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const previousConnectionRef = useRef(true);
  const onlineBannerTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const newConnectionState = state.isConnected ?? true;
      
      // If connection was restored (previously disconnected, now connected)
      if (!previousConnectionRef.current && newConnectionState) {
        console.log('Connection restored, showing banner');
        setShowOnlineBanner(true);
        
        // Clear any existing timer
        if (onlineBannerTimer.current) {
          clearTimeout(onlineBannerTimer.current);
        }
        
        // Hide the online banner after 3 seconds
        onlineBannerTimer.current = setTimeout(() => {
          console.log('Timer expired, hiding banner');
          setShowOnlineBanner(false);
        }, 3000);
      }
      
      // Update state and ref
      setIsConnected(newConnectionState);
      previousConnectionRef.current = newConnectionState;
      console.log('Connection changed. Is connected?', newConnectionState);
    });
    
    // Initial check
    NetInfo.fetch().then(state => {
      const initialConnectionState = state.isConnected ?? true;
      setIsConnected(initialConnectionState);
      previousConnectionRef.current = initialConnectionState;
    });
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      unsubscribe();
      if (onlineBannerTimer.current) {
        clearTimeout(onlineBannerTimer.current);
      }
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, showOnlineBanner }}>
      <>
        {!isConnected && (
          <View style={styles.offlineContainer}>
            <Text style={styles.bannerText}>No Internet Connection</Text>
          </View>
        )}
        {isConnected && showOnlineBanner && (
          <View style={styles.onlineContainer}>
            <Text style={styles.bannerText}>Back Online</Text>
          </View>
        )}
        {children}
      </>
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: '#b52424',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
  },
  onlineContainer: {
    backgroundColor: '#2eb82e',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
  },
  bannerText: {
    color: '#fff',
    fontWeight: 'bold',
  }
}); 