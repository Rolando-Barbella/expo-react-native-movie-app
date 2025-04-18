import React from 'react';
import { ActivityIndicator} from 'react-native';
import styled from 'styled-components/native';
import MovieCarousel from '../../components/MovieCarusel';
import { NavigationProp } from '@react-navigation/native';
import { Genre, Movie } from '../types';
import { Colors } from '../../constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { getGenres, getMovies } from '../lib/api';

const HomeScreen = ({ navigation }: { navigation: NavigationProp<{
  Detail: { movie: Movie; genre: Genre };
}> }) => {
  const {
    data: genresData,
    isLoading: genresLoading,
    error: genresError,
    refetch: refetchGenres,
  } = useQuery<Genre[]>({
    queryKey: ['genres'],
    queryFn: getGenres,
    select: (data) => data.slice(0, 3),
  });

  const {
    data: moviesData,
    isLoading: moviesLoading,
    error: moviesError,
    refetch: refetchMovies,
  } = useQuery<Movie[]>({
    queryKey: ['movies'],
    queryFn: getMovies,
  });


  const isLoading = genresLoading || moviesLoading;
  const error = genresError || moviesError;

  const refetchAll = () => {
    refetchGenres();
    refetchMovies();
  };

   // If we have cached data but no network, show cached data with warning
   if ((!genresData?.length || !moviesData?.length) && !isLoading) {
    return (
      <CenterContainer testID='container'>
        <ErrorText>No data available. Please check your connection.</ErrorText>
        <RetryButton onPress={refetchAll}>
          <RetryText>Retry</RetryText>
        </RetryButton>
      </CenterContainer>
    );
  }

  if (isLoading) {
    return (
      <CenterContainer testID='container'>
        <ActivityIndicator size="large" color={Colors.dark.tint} testID='loading-indicator'/>
      </CenterContainer>
    );
  }

  if (error) {
    return (
      <CenterContainer testID='container'>
        <ErrorText>{
          error.message || 'Failed to load data. Please try again.'
        }</ErrorText>
        <RetryButton onPress={refetchAll}>
          <RetryText>Retry</RetryText>
        </RetryButton>
      </CenterContainer>
    );
  }

  return (
    <Container testID='container'>
      {genresData?.map((genre: Genre) => (
        <MovieCarousel
          key={genre.id}
          genre={genre}
          movies={moviesData?.filter((movie: Movie) => movie.genre_ids.includes(genre.id)) || []}
          navigation={navigation}
        />
      ))}
    </Container>
  );
};

const Container = styled.ScrollView`
  flex: 1;
  background-color: ${Colors.dark.hardcore.primary};
`;

const CenterContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${Colors.dark.hardcore.primary};
`;

const ErrorText = styled.Text`
  color: ${Colors.dark.hardcore.text};
  font-size: 16px;
  text-align: center;
  margin-bottom: 20px;
`;

const RetryButton = styled.TouchableOpacity`
  padding: 10px;
  background-color: ${Colors.dark.tint};
  border-radius: 5px;
`;

const RetryText = styled.Text`
  color: ${Colors.dark.hardcore.text};
  font-size: 16px;
`;

export default HomeScreen;