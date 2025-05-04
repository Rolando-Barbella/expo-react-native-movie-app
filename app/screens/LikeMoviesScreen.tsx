import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Movie, PendingAction } from '../types';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFavoriteMovies } from '../lib/api';
import { useNetwork } from '../lib/NetworkContext';

type LikeMoviesScreenProps = {
  navigation: NavigationProp<{
    Detail: { movie: Movie };
  }>;
};

const LikeMoviesScreen = ({ navigation }: LikeMoviesScreenProps) => {
  const queryClient = useQueryClient();
  const { isConnected } = useNetwork();
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  
  // Query for favorite movies with online/offline support
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favoriteMovies'],
    queryFn: getFavoriteMovies,
    staleTime: 1000 * 60 * 5, // 5 minutes
    networkMode: 'always',
    // This ensures we keep previous data when offline
    placeholderData: (previousData) => previousData || [],
  });

  // Store favorites in the cache when they're loaded successfully
  useEffect(() => {
    if (favorites.length > 0) {
      queryClient.setQueryData(['cachedFavorites'], favorites);
    }
  }, [favorites, queryClient]);


  useFocusEffect(
    React.useCallback(() => {
      const actions = queryClient.getQueryData<PendingAction[]>(['pendingActions']) || [];
      setPendingActions(actions);
    }, [queryClient])
  );
  
  // Process favorites based on pending actions and cached data when offline
  const processedFavorites = React.useMemo(() => {
    // Start with current favorites or cached favorites if we're offline and have no favorites
    let baseList: Movie[] = [...favorites];
    
    if (!isConnected) {
      if (baseList.length === 0) {
        // If we're offline and have no favorites from the query, use cached favorites
        const cachedFavorites = queryClient.getQueryData<Movie[]>(['cachedFavorites']) || [];
        baseList = [...cachedFavorites];
      }
      
      if (pendingActions.length > 0) {
        let processedList = [...baseList];
        
        pendingActions.forEach(action => {
          if (action.type === 'toggleFavorite') {
            if (action.status) {
              // Add to favorites if not already present
              const movieDetails = queryClient.getQueryData<Movie>(['movieDetails', action.movieId]);
              if (movieDetails && !processedList.some(movie => String(movie.id) === String(movieDetails.id))) {
                processedList.push(movieDetails);
              }
            } else {
              processedList = processedList.filter(movie => String(movie.id) !== String(action.movieId));
            }
          }
        });
        
        return processedList;
      }
    }
    return baseList;
  }, [favorites, pendingActions, isConnected, queryClient]);

  const getImagePath = (path: string) => {
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const renderMovieItem = ({ item } : {item: Movie}) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => navigation.navigate('Detail', { movie: item })}
    >
      <Image
        style={styles.moviePoster}
        source={{ uri: getImagePath(item.poster_path) }}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#ffd700" />
          <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
        </View>
        <Text style={styles.releaseDate}>{item.release_date?.split('-')[0]}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && isConnected && processedFavorites.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.tint} testID="loading-indicator" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Favorite Movies</Text>
        {!isConnected && <Text style={styles.offlineIndicator}>Offline Mode</Text>}
      </View>
      {processedFavorites.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="heart-outline" size={64} color={Colors.dark.hardcore.emptyState} />
          <Text style={styles.emptyText} testID="loading-indicator">No favorite movies yet</Text>
        </View>
      ) : (
        <FlatList
          data={processedFavorites}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 8 }}
          numColumns={2}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.hardcore.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.hardcore.primary,
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.hardcore.border,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieCard: {
    flex: 1,
    margin: 8,
    backgroundColor: Colors.dark.hardcore.card,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.dark.hardcore.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  moviePoster: {
    width: '100%',
    height: 200,
  },
  movieInfo: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.hardcore.text,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.hardcore.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    color: Colors.dark.hardcore.text,
    marginLeft: 4,
  },
  releaseDate: {
    color: Colors.dark.hardcore.textSecondary,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.dark.hardcore.emptyState,
    fontSize: 18,
    marginTop: 16,
  },
  offlineIndicator: {
    fontSize: 14,
    color: Colors.dark.hardcore.emptyState,
    marginTop: 4,
  },
});

export default LikeMoviesScreen;