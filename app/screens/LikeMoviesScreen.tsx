import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styled from 'styled-components/native';
import { API_KEY, LIKE_MOVIES_URL } from '../config';
import { Movie } from '../types';
import { NavigationProp } from '@react-navigation/native';

type LikeMoviesScreenProps = {
  navigation: NavigationProp<{
    Detail: { movie: Movie };
  }>;
};

const LikeMoviesScreen = ({ navigation }: LikeMoviesScreenProps) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteMovies();
  }, []);

  const fetchFavoriteMovies = async () => {
    try {
      const response = await fetch(
        LIKE_MOVIES_URL,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'accept': 'application/json'
          }
        }
      );
      const data = await response.json();
      setFavorites(data.results);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#fff" testID="loading-indicator" />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <HeaderContainer>
        <HeaderTitle>Favorite Movies</HeaderTitle>
      </HeaderContainer>
      {favorites.length === 0 ? (
        <EmptyStateContainer>
          <Ionicons name="heart-outline" size={64} color="#666" />
          <EmptyText>No favorite movies yet</EmptyText>
        </EmptyStateContainer>
      ) : (
        <FlatList
          data={favorites}
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
  background-color: #000;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #000;
`;

export const HeaderContainer = styled.View`
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #333;
`;

export const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const MovieCard = styled.TouchableOpacity`
  flex: 1;
  margin: 8px;
  background-color: #111;
  border-radius: 12px;
  overflow: hidden;
  elevation: 5;
  shadow-color: #000;
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
  color: #fff;
`;

export const MovieTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
`;

export const RatingContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`;

export const RatingText = styled.Text`
  color: #fff;
  margin-left: 4px;
`;

export const ReleaseDate = styled.Text`
  color: #888;
  font-size: 14px;
`;

export const EmptyText = styled.Text`
  color: #666;
  font-size: 18px;
  margin-top: 16px;
`;

export default LikeMoviesScreen;