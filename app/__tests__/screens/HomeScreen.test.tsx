import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { NavigationProp } from '@react-navigation/native';
import { Genre, Movie } from '@/app/types';

const mockGenres = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Comedy' },
  { id: 3, name: 'Drama' },
];

const mockMovies = [
  { id: 1, title: 'Movie 1', genre_ids: [1, 2] },
  { id: 2, title: 'Movie 2', genre_ids: [3] },
];

const mockNavigation = {
  navigate: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
} as unknown as NavigationProp<{
  Detail: { movie: Movie; genre: Genre };
}>;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn() as jest.Mock; ;
  });

  it('renders loading indicator while fetching data', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<HomeScreen navigation={mockNavigation} />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders genres and movies after successful data fetching', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ genres: mockGenres }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockMovies }),
      });
  
    render(<HomeScreen navigation={mockNavigation} />);
  
    await waitFor(() => {
      expect(screen.getByTestId('container')).toBeTruthy();
    });
  
    expect(screen.getByText('Action')).toBeTruthy();
    expect(screen.getByText('Comedy')).toBeTruthy();
    expect(screen.getByText('Drama')).toBeTruthy();
  
    const movie1Elements = screen.getAllByText('Movie 1');
    const movie2Elements = screen.getAllByText('Movie 2');
  
    expect(movie1Elements.length).toBe(2);
    expect(movie2Elements.length).toBe(1);
  });

  it('renders error message when data fetching fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<HomeScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load data. Please try again.')).toBeTruthy();
    });

    expect(screen.getByText('Retry')).toBeTruthy();
  });

});