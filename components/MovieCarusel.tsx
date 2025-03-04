import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { Genre } from '../app/types';

interface MovieCarousel {
  id: string;
  title: string;
  poster_path: string;
}

interface MovieCarouselProps {
  genre: Genre;
  movies: MovieCarousel[];
  navigation: {
    navigate: (screenName: string, params: { movie: MovieCarousel; genre: Genre }) => void;
  };
  key: number;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ genre, movies, navigation}) => {
  const renderMovie = ({ item: movie }: { item: MovieCarousel }) => (
    <TouchableOpacity
      style={styles.movieCard}
      testID="movie-card"
      onPress={() => navigation.navigate('Detail', { movie, genre })}
    >
      <Image
        style={styles.poster}
        source={{
          uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        }}
      />
      <Text style={styles.movieTitle} numberOfLines={2}>
        {movie.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{genre.name}</Text>
      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
    marginBottom: 10,
  },
  movieCard: {
    width: 120,
    marginHorizontal: 5,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default MovieCarousel;