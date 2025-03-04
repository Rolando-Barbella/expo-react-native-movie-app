import React, { useState, useEffect } from 'react';
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
import {
  Roboto_100Thin_Italic,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { useFonts } from 'expo-font';
import { API_KEY } from '../config';
import { Movie } from '../types';
import { NavigationProp } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

type DetailScreenProps = {
  navigation: NavigationProp<{
    Detail: { movie: Movie };
  }>;
  route: any;
};

const DetailScreen = ({ route, navigation }: DetailScreenProps) => {
  const { movie } = route.params;
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    Roboto_700Bold,
    Roboto_100Thin_Italic,
  });

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/account/21752759/favorite/movies`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
            }
          }
        );
        const data = await response.json();
        const isFavorite = data.results.some((favMovie: Movie) => favMovie.id === movie.id);
        setIsWishlisted(isFavorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [movie.id]);

  const toggleWishlist = async () => {
    try {
      const response = await fetch('https://api.themoviedb.org/3/account/21752759/favorite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          media_type: "movie",
          media_id: movie.id,
          favorite: !isWishlisted
        })
      });

      if (response.ok) {
        setIsWishlisted(!isWishlisted);
        Alert.alert(
          "Success",
          `${movie.title} has been ${!isWishlisted ? 'added to' : 'removed from'} favorites`
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to update favorites. Please try again."
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert(
        "Error",
        "Something went wrong. Please check your connection and try again."
      );
    }
  };

  const getImagePath = (path: string) => {
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#fff" />;
  }

  const getStyleConfig = () => {
    const genre = movie.genre_ids?.[0];
  
    switch (genre) {
      case 28: // Action
        return {
          font: 'SpaceMono',
          backgroundColor: '#140f21',
        };
      case 12: // Adventure
        return {
          font: 'Roboto_700Bold',
          backgroundColor: '#0c1a27',
        };
      case 16: // Animation
        return {
          font: 'Roboto_100Thin_Italic',
          backgroundColor: '#1e272e',
        };
      default:
        return {
          font: 'SpaceMono',
          backgroundColor: '#1e272e',
        };
    }
  };

  const { font, backgroundColor } = getStyleConfig();

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImagePath(movie.backdrop_path || movie.poster_path) }}
          style={styles.backdropImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        <IconButton
          style={{ position: 'absolute', top: 16, left: 16 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </IconButton>
      </View>

      <StyledScrollView backgroundColor={backgroundColor}>
        <Row>
          <View style={styles.titleContainer}>
            <Title font={font}>{movie.title}</Title>
            <RegularText secondary>{movie.release_date?.split('-')[0]}</RegularText>
          </View>

          <IconButton
            active={isWishlisted}
            onPress={toggleWishlist}
            style={{backgroundColor: null}}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={24}
              color={isWishlisted ? "#ff4757" : "#fff"}
            />
          </IconButton>
        </Row>

        <Row>
          <Ionicons name="star" size={16} color="#ffd700" />
          <RegularText>{movie.vote_average?.toFixed(1)} / 10</RegularText>
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
  background-color: #0F111D;
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
  color: #FFFFFF;
  margin-bottom: 4px;
  ${(props: { font: string; }) => props.font && `font-family: ${props.font}`};
`;

export const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 8px;
`;

export const RegularText = styled.Text`
  font-size: 16px;
  color: ${(props: { secondary: string; }) => props.secondary ? '#9CA3AF' : '#FFFFFF'};
`;

export const BodyText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: #D1D5DB;
`;

export const IconButton = styled.TouchableOpacity`
  padding: 12px;
  border-radius: 25px;
  background-color: ${(props: { active: boolean; }) => props.active ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
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
});

export default DetailScreen;


