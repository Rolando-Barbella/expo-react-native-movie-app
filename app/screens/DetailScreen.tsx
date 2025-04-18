import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import styled from 'styled-components/native';
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
    <Container>
      <StatusBar barStyle="light-content" />
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}` }}
          style={styles.backdropImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        <IconButton
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.hardcore.text} />
        </IconButton>
      </View>

      <StyledScrollView>
        <Row>
          <View style={styles.titleContainer}>
            <Title>{movie.title}</Title>
            <RegularText secondary>{movie.release_date?.split('-')[0]}</RegularText>
          </View>

          <IconButton
            active={isWishlisted}
            onPress={toggleWishlist}
            style={{backgroundColor: null}}
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
          </IconButton>
        </Row>

        <Row>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            <RegularText style={{ marginLeft: 4 }}>{movie.vote_average?.toFixed(1)} / 10</RegularText>
          </View>
        </Row>

        <Section>
          <SectionTitle>Overview</SectionTitle>
          <BodyText>{movie.overview}</BodyText>
        </Section>

        <Section>
          <SectionTitle>Additional Information</SectionTitle>
          <Row>
            <RegularText secondary>Original Title:</RegularText>
            <RegularText>{movie.original_title}</RegularText>
          </Row>
          <Row>
            <RegularText secondary>Popularity:</RegularText>
            <RegularText>{movie.popularity?.toFixed(0)}</RegularText>
          </Row>
          <Row>
            <RegularText secondary>Vote Count:</RegularText>
            <RegularText>{movie.vote_count}</RegularText>
          </Row>
        </Section>
      </StyledScrollView>
    </Container>
  );
};

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${Colors.dark.hardcore.primary};
`;

const StyledScrollView = styled.ScrollView`
    flex: 1;
    padding: 16px;
    background-color: ${(props: { backgroundColor: string }) => props.backgroundColor};
  `;

export const Section = styled.View`
  margin-bottom: 24px;
`;

export const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding-vertical: 8px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

export const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${Colors.dark.hardcore.text};
  margin-bottom: 4px;
  ${(props: { font: string; }) => props.font && `font-family: ${props.font}`};
`;

export const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: ${Colors.dark.hardcore.text};
  margin-bottom: 8px;
`;

export const RegularText = styled.Text`
  font-size: 16px;
  color: ${(props: { secondary: string; }) => props.secondary ? Colors.dark.hardcore.textSecondary : Colors.dark.hardcore.text};
`;

export const BodyText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: ${Colors.dark.hardcore.text};
`;

export const IconButton = styled.TouchableOpacity`
  padding: 12px;
  border-radius: 25px;
  background-color: ${(props: { active: boolean; }) => props.active ? `rgba(${parseInt(Colors.dark.hardcore.favorite.slice(1, 3), 16)}, ${parseInt(Colors.dark.hardcore.favorite.slice(3, 5), 16)}, ${parseInt(Colors.dark.hardcore.favorite.slice(5, 7), 16)}, 0.2)` : 'rgba(255, 255, 255, 0.1)'};
`;

const styles = StyleSheet.create({
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
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  iconButton: { position: 'absolute', top: 16, left: 16 }
});

export default DetailScreen;