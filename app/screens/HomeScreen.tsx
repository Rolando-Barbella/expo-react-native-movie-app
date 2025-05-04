import React from 'react';
import { ActivityIndicator, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    select: (data) => data.slice(0, 4),
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
      <View style={styles.centerContainer} testID='container'>
        <Text style={styles.errorText}>No data available. Please check your connection.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchAll}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer} testID='container'>
        <ActivityIndicator size="large" color={Colors.dark.tint} testID='loading-indicator'/>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer} testID='container'>
        <Text style={styles.errorText}>{
          error.message || 'Failed to load data. Please try again.'
        }</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchAll}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} testID='container'>
      {genresData?.map((genre: Genre) => {
        const genreMovies = moviesData?.filter((movie: Movie) => movie.genre_ids.includes(genre.id)) || [];
        return (
          <MovieCarousel
            key={genre.id}
            genre={genre}
            movies={genreMovies}
            navigation={navigation}
          />
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.hardcore.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.hardcore.primary,
  },
  errorText: {
    color: Colors.dark.hardcore.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    padding: 10,
    backgroundColor: Colors.dark.tint,
    borderRadius: 5,
  },
  retryText: {
    color: Colors.dark.hardcore.text,
    fontSize: 16,
  },
});

export default HomeScreen;