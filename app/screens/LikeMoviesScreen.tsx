import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styled from 'styled-components/native';
import { Movie } from '../types';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFavoriteMovies } from '../lib/api';
import { useNetwork } from '../lib/NetworkContext';

interface PendingAction {
  type: string;
  movieId: number;
  status: boolean;
  timestamp: number;
}

type LikeMoviesScreenProps = {
  navigation: NavigationProp<{
    Detail: { movie: Movie };
  }>;
};

const LikeMoviesScreen = ({ navigation }: LikeMoviesScreenProps) => {
  const queryClient = useQueryClient();
  const { isConnected } = useNetwork();
  const [offlineLikedMovies, setOfflineLikedMovies] = useState<Movie[]>([]);
  
  // Use React Query to fetch and cache favorite movies
  const { 
    data: favorites = [], 
    isLoading, 
    refetch 
  } = useQuery<Movie[]>({
    queryKey: ['favoriteMovies'],
    queryFn: getFavoriteMovies,
    // If offline, continue showing cached data
    networkMode: 'always',
  });

  // Check for pending actions and fetch related movie data
  useEffect(() => {
    const checkPendingLikes = async () => {
      const pendingActions = queryClient.getQueryData<PendingAction[]>(['pendingActions']) || [];
      
      // Find pending actions where movies are being added to favorites (status=true)
      const pendingLikes = pendingActions.filter(action => 
        action.type === 'toggleFavorite' && action.status === true
      );
      
      if (pendingLikes.length === 0) {
        setOfflineLikedMovies([]);
        return;
      }
      
      // Get movie details for pending likes
      const likedMovieIds = pendingLikes.map(action => action.movieId);
      
      // Check if we already have these movies in cache
      const existingMovies: Movie[] = [];
      
      // Try to find the movies in the movies cache
      const cachedMovies = queryClient.getQueryData<Movie[]>(['movies']);
      if (cachedMovies) {
        for (const id of likedMovieIds) {
          const movie = cachedMovies.find(m => Number(m.id) === Number(id));
          if (movie) existingMovies.push(movie);
        }
      }
      
      // If we have already viewed these movie details, they should be in cache
      for (const id of likedMovieIds) {
        const movieDetails = queryClient.getQueryData<Movie>(['movieDetails', id]);
        if (movieDetails) {
          // Check if we already added this movie
          if (!existingMovies.some(m => m.id === movieDetails.id)) {
            existingMovies.push(movieDetails);
          }
        }
      }
      
      setOfflineLikedMovies(existingMovies);
    };
    
    checkPendingLikes();
  }, [queryClient]);

  // Refetch favorites when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // First check for any pending actions
      const syncPendingFavoriteActions = async () => {
        if (!isConnected) return;
        
        const pendingActions = queryClient.getQueryData<PendingAction[]>(['pendingActions']) || [];
        
        // If we have pending favorite actions, we should invalidate favorites
        const hasFavoriteChanges = pendingActions.some(action => 
          action.type === 'toggleFavorite'
        );
        
        if (hasFavoriteChanges) {
          // Invalidate favorites to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['favoriteMovies'] });
        } else {
          // If no pending actions, just refetch to make sure data is fresh
          refetch();
        }
      };
      
      syncPendingFavoriteActions();
    }, [isConnected, queryClient, refetch])
  );

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

  // Combine server favorites with pending offline favorites
  const combinedFavorites = React.useMemo(() => {
    // Create a new array from the API favorites
    const result = [...favorites];
    
    // Add offline liked movies that aren't already in the favorites list
    offlineLikedMovies.forEach(movie => {
      if (!result.some(fav => fav.id === movie.id)) {
        result.push(movie);
      }
    });
    
    return result;
  }, [favorites, offlineLikedMovies]);

  if (isLoading && combinedFavorites.length === 0) {
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
        {!isConnected && offlineLikedMovies.length > 0 && (
          <PendingBadge>
            <PendingText>
              {offlineLikedMovies.length} pending offline {offlineLikedMovies.length === 1 ? 'change' : 'changes'}
            </PendingText>
          </PendingBadge>
        )}
      </HeaderContainer>
      {combinedFavorites.length === 0 ? (
        <EmptyStateContainer>
          <Ionicons name="heart-outline" size={64} color={Colors.dark.hardcore.emptyState} />
          <EmptyText>No favorite movies yet</EmptyText>
        </EmptyStateContainer>
      ) : (
        <FlatList
          data={combinedFavorites}
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
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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

export const PendingBadge = styled.View`
  background-color: #f39c12;
  padding: 4px 8px;
  border-radius: 12px;
`;

export const PendingText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: bold;
`;

export default LikeMoviesScreen;