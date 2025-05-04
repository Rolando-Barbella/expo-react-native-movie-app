import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Movie, PendingAction } from '../types';
import { NavigationProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkFavoriteStatus, toggleFavorite } from '../lib/api';
import { useNetwork } from '../lib/NetworkContext';

const { width, height } = Dimensions.get('window');

type DetailScreenProps = {
  navigation: NavigationProp<{
    Detail: { movie: Movie };
  }>;
  route: any;
};

const DetailScreen = ({ route, navigation }: DetailScreenProps) => {
  const { movie } = route.params;
  const queryClient = useQueryClient();
  const { isConnected } = useNetwork();


  React.useEffect(() => {
    queryClient.setQueryData(['movieDetails', movie.id], movie);
  }, [movie, queryClient]);

  const { data: isWishlisted} = useQuery({
    queryKey: ['favoriteStatus', movie.id],
    queryFn: () => checkFavoriteStatus(movie.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    networkMode: 'always',
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      if (!isConnected) {
        const pendingActions = queryClient.getQueryData<PendingAction[]>(['pendingActions']) || [];
        await queryClient.setQueryData<PendingAction[]>(['pendingActions'], [
          ...pendingActions,
          { 
            type: 'toggleFavorite', 
            movieId: movie.id, 
            status: newStatus, 
            timestamp: Date.now() 
          }
        ]);
        return newStatus;
      }
      await toggleFavorite(movie.id, newStatus);
      return newStatus;
    },
    // Optimistically update the cache
    onMutate: async (newStatus) => {

      await queryClient.cancelQueries({
        queryKey: ['favoriteStatus', movie.id]
      });

      const previousStatus = queryClient.getQueryData(['favoriteStatus', movie.id]);
      queryClient.setQueryData(['favoriteStatus', movie.id], newStatus);
      
      if (!isConnected) {
        Alert.alert(
          "Saved Offline",
          `${movie.title} has been ${newStatus ? 'added to' : 'removed from'} favorites and will sync when back online`
        );
      } else {
        Alert.alert(
          "Success",
          `${movie.title} has been ${newStatus ? 'added to' : 'removed from'} favorites`
        );
      }
      return { previousStatus };
    },
    onError: (error, newStatus, context) => {
      // Rollback to previous value if mutation fails
      queryClient.setQueryData(
        ['favoriteStatus', movie.id],
        context?.previousStatus
      );
      Alert.alert(
        "Error",
        "Failed to update favorites. The change will be retried when you're back online."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['favoriteStatus', movie.id]
      });
      queryClient.invalidateQueries({
        queryKey: ['favoriteMovies']
      });
    },
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
  });

  const toggleWishlist = () => {
    const newStatus = !isWishlisted;
    toggleFavoriteMutation.mutate(newStatus);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}` }}
          style={styles.backdropImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.hardcore.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.row}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={[styles.regularText, styles.secondaryText]}>{movie.release_date?.split('-')[0]}</Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleWishlist}
            disabled={toggleFavoriteMutation.isPending}
          >
            {toggleFavoriteMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.dark.hardcore.text} />
            ) : (
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={24}
                color={isWishlisted ? Colors.dark.hardcore.favorite : Colors.dark.hardcore.text}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.starContainer}>
            {[...Array(5)].map((_, index) => {
              const rating = movie.vote_average / 2;
              const starValue = index + 1;
              return (
                <Ionicons
                  key={index}
                  name={rating >= starValue ? "star" : rating >= starValue - 0.5 ? "star-half" : "star-outline"}
                  size={16}
                  color={Colors.dark.hardcore.accent}
                  style={{ marginRight: 2 }}
                />
              );
            })}
            <Text style={[styles.regularText, { marginLeft: 4 }]}>{movie.vote_average?.toFixed(1)} / 10</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.bodyText}>{movie.overview}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.row}>
            <Text style={[styles.regularText, styles.secondaryText]}>Original Title:</Text>
            <Text style={styles.regularText}>{movie.original_title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.regularText, styles.secondaryText]}>Popularity:</Text>
            <Text style={styles.regularText}>{movie.popularity?.toFixed(0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.regularText, styles.secondaryText]}>Vote Count:</Text>
            <Text style={styles.regularText}>{movie.vote_count}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.hardcore.primary,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.transparent,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.hardcore.text,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.hardcore.text,
    marginBottom: 8,
  },
  regularText: {
    fontSize: 16,
    color: Colors.dark.hardcore.text,
  },
  secondaryText: {
    color: Colors.dark.hardcore.textSecondary,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.dark.hardcore.text,
  },
  iconButton: {
    padding: 12,
    borderRadius: 25,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    position: 'absolute', 
    top: 16, 
    left: 16,
    backgroundColor: Colors.dark.hardcore.transparent,
  },
  imageContainer: {
    width: width,
    height: height * 0.3,
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
});

export default DetailScreen;