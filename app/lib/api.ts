import { API_KEY, BASE_URL } from '../config';
import { Genre, Movie } from '../types';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Fetches movie genres from the API
 * @returns A promise that resolves to an array of genres
 */
export const getGenres = async (): Promise<Genre[]> => {
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

/**
 * Fetches popular movies from the API
 * @returns A promise that resolves to an array of movies
 */
export const getMovies = async (): Promise<Movie[]> => {
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

/**
 * Fetches favorite movies from the API
 * @returns A promise that resolves to an array of favorite movies
 */
export const getFavoriteMovies = async (): Promise<Movie[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/account/21752759/favorite/movies`,
      { headers }
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching favorite movies:', error);
    return [];
  }
};

/**
 * Checks if a movie is in the user's favorites
 * @param movieId The ID of the movie to check
 * @returns A promise that resolves to a boolean indicating if the movie is favorited
 */
export const checkFavoriteStatus = async (movieId: number): Promise<boolean> => {
  try {
    const response = await fetch(
      `${BASE_URL}/account/21752759/favorite/movies`,
      { headers }
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.results.some((favMovie: Movie) => favMovie.id === movieId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  }
};

/**
 * Toggles a movie's favorite status
 * @param movieId The ID of the movie to toggle
 * @param favorite Whether to add (true) or remove (false) from favorites
 * @returns A promise that resolves when the operation is complete
 */
export const toggleFavorite = async (movieId: number, favorite: boolean): Promise<void> => {
  const response = await fetch(`${BASE_URL}/account/21752759/favorite`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      media_type: "movie",
      media_id: movieId,
      favorite
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update favorite status');
  }
}; 