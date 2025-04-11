import React, { useState, useEffect } from 'react';
import { ActivityIndicator} from 'react-native';
import styled from 'styled-components/native';
import MovieCarousel from '../../components/MovieCarusel';
import { API_KEY, BASE_URL } from '../config';
import { NavigationProp } from '@react-navigation/native';
import { Genre, Movie } from '../types';
import { Colors } from '../../constants/Colors';

const HomeScreen = ({ navigation } : {navigation: NavigationProp<{
  Detail: { movie: Movie, genre: Genre };
}>}) => {

  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

const getGenres = async () => {
  try {
    const response = await fetch(`${BASE_URL}/genre/movie/list?language=en`, { headers });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
};

const getMovies = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`,
      { headers }
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
};

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [genresData, moviesData] = await Promise.all([
        getGenres(),
        getMovies()
      ]);
      
      setGenres(genresData.slice(0, 3));
      setMovies(moviesData);
    } catch (error) {
      setError('Failed to load data. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <CenterContainer testID='container'>
        <ActivityIndicator size="large" color={Colors.dark.tint} testID='loading-indicator'/>
      </CenterContainer>
    );
  }

  if (error) {
    return (
      <CenterContainer testID='container'>
        <ErrorText>{error}</ErrorText>
        <RetryButton onPress={loadData}>
          <RetryText>Retry</RetryText>
        </RetryButton>
      </CenterContainer>
    );
  }

  return (
    <Container testID='container'>
      {genres.map((genre: Genre) => (
        <MovieCarousel
          key={genre.id}
          genre={genre}
          movies={movies.filter((movie: Movie) => movie.genre_ids.includes(genre.id))}
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