import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import LikeMoviesScreen from '../../screens/LikeMoviesScreen';
import { NavigationProp } from '@react-navigation/native';
import { Genre, Movie } from '@/app/types';

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

const mockMovies = [
  {
    id: 1,
    title: 'Movie 1',
    poster_path: '/poster1.jpg',
    vote_average: 8.5,
    release_date: '2021-12-01',
  },
  {
    id: 2,
    title: 'Movie 2',
    poster_path: '/poster2.jpg',
    vote_average: 7.2,
    release_date: '2022-01-15',
  },
];

describe('<LikeMoviesScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock; ;
  });

  it('shows the loading state initially', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockMovies }),
    });

    const { getByTestId } = render(<LikeMoviesScreen navigation={mockNavigation} />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows empty state when there are no favorite movies', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
  
    const { getByText } = render(<LikeMoviesScreen navigation={mockNavigation} />);
  
    await waitFor(() => {
      expect(getByText('No favorite movies yet')).toBeTruthy();
    });
  });

  it('displays the list of favorite movies', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockMovies }),
    });

    const { getByText} = render(
      <LikeMoviesScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Movie 1')).toBeTruthy();
      expect(getByText('Movie 2')).toBeTruthy();
      expect(getByText('8.5')).toBeTruthy();
      expect(getByText('2022')).toBeTruthy();
    });
  });

  it('navigates to the detail screen when a movie is selected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockMovies }),
    });
  
    const { getByText } = render(<LikeMoviesScreen navigation={mockNavigation} />);
  
    await waitFor(() => expect(getByText('Movie 1')).toBeTruthy());
  
    fireEvent.press(getByText('Movie 1'));
  
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Detail', {
        movie: mockMovies[0],
      });
    });
  });
  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
  
    const { getByText } = render(<LikeMoviesScreen navigation={mockNavigation} />);
  
    await waitFor(() => {
      expect(getByText('No favorite movies yet')).toBeTruthy();
    });
  
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

