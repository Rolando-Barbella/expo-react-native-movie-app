import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styled from 'styled-components/native';
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
    <MovieCard onPress={() => navigation.navigate('Detail', { movie: item })}>
      <MoviePoster
        source={{ uri: getImagePath(item.poster_path) }}
        resizeMode="cover"
      />
      <MovieInfo>
        <MovieTitle numberOfLines={2}>{item.title}</MovieTitle>
        <RatingContainer>
          <Ionicons name="star" size={16} color="#ffd700" />
          <RatingText>{item.vote_average.toFixed(1)}</RatingText>
        </RatingContainer>
        <ReleaseDate>{item.release_date?.split('-')[0]}</ReleaseDate>
      </MovieInfo>
    </MovieCard>
  );

  if (isLoading && isConnected && processedFavorites.length === 0) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color={Colors.dark.tint} testID="loading-indicator" />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <HeaderContainer>
        <HeaderTitle>Favorite Movies</HeaderTitle>
        {!isConnected && <OfflineIndicator>Offline Mode</OfflineIndicator>}
      </HeaderContainer>
      {processedFavorites.length === 0 ? (
        <EmptyStateContainer>
          <Ionicons name="heart-outline" size={64} color={Colors.dark.hardcore.emptyState} />
          <EmptyText testID="loading-indicator">No favorite movies yet</EmptyText>
        </EmptyStateContainer>
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
    </Container>
  );
};

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${Colors.dark.hardcore.primary};
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${Colors.dark.hardcore.primary};
`;

export const HeaderContainer = styled.View`
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.dark.hardcore.border};
`;

export const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const MovieCard = styled.TouchableOpacity`
  flex: 1;
  margin: 8px;
  background-color: ${Colors.dark.hardcore.card};
  border-radius: 12px;
  overflow: hidden;
  elevation: 5;
  shadow-color: ${Colors.dark.hardcore.primary};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
`;

export const MoviePoster = styled.Image`
  width: 100%;
  height: 200px;
`;

export const MovieInfo = styled.View`
  padding: 12px;
`;

export const HeaderTitle = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${Colors.dark.hardcore.text};
`;

export const MovieTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${Colors.dark.hardcore.text};
  margin-bottom: 4px;
`;

export const RatingContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`;

export const RatingText = styled.Text`
  color: ${Colors.dark.hardcore.text};
  margin-left: 4px;
`;

export const ReleaseDate = styled.Text`
  color: ${Colors.dark.hardcore.textSecondary};
  font-size: 14px;
`;

export const EmptyText = styled.Text`
  color: ${Colors.dark.hardcore.emptyState};
  font-size: 18px;
  margin-top: 16px;
`;

export const OfflineIndicator = styled.Text`
  font-size: 14px;
  color: ${Colors.dark.hardcore.emptyState};
  margin-top: 4px;
`;

export default LikeMoviesScreen;