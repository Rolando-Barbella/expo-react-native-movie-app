import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import LikeMoviesScreen from '../../screens/LikeMoviesScreen';
import { NavigationProp, NavigationContainer } from '@react-navigation/native';
import { Genre, Movie } from '@/app/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as api from '../../lib/api';

jest.mock('../../lib/api', () => ({
  getFavoriteMovies: jest.fn(),
}));

// Mock the network context
jest.mock('../../lib/NetworkContext', () => ({
  useNetwork: jest.fn().mockReturnValue({ isConnected: true }),
  NetworkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry failed requests in tests
      gcTime: Infinity, // Updated from cacheTime to gcTime
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

describe('<LikeMoviesScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the loading state initially', async () => {
    // Setup the mock to return a promise that never resolves to simulate loading
    const getFavoriteMoviesMock = api.getFavoriteMovies as jest.Mock;
    getFavoriteMoviesMock.mockReturnValue(new Promise(() => {}));

    const { getByTestId } = renderWithProviders(
      <LikeMoviesScreen navigation={mockNavigation} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows empty state when there are no favorite movies', async () => {
    // Setup the mock to return an empty array
    const getFavoriteMoviesMock = api.getFavoriteMovies as jest.Mock;
    getFavoriteMoviesMock.mockResolvedValue([]);
  
    const { getByText } = renderWithProviders(
      <LikeMoviesScreen navigation={mockNavigation} />
    );
  
    await waitFor(() => {
      expect(getByText('No favorite movies yet')).toBeTruthy();
    });
  });

  it('displays the list of favorite movies', async () => {
    // Setup the mock to return mock movies
    const getFavoriteMoviesMock = api.getFavoriteMovies as jest.Mock;
    getFavoriteMoviesMock.mockResolvedValue(mockMovies);

    const { getByText } = renderWithProviders(
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
    // Setup the mock to return mock movies
    const getFavoriteMoviesMock = api.getFavoriteMovies as jest.Mock;
    getFavoriteMoviesMock.mockResolvedValue(mockMovies);
  
    const { getByText } = renderWithProviders(
      <LikeMoviesScreen navigation={mockNavigation} />
    );
  
    await waitFor(() => expect(getByText('Movie 1')).toBeTruthy());
  
    fireEvent.press(getByText('Movie 1'));
  
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Detail', {
        movie: mockMovies[0],
      });
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock console.error to prevent the error from being displayed in test output
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Setup the mock to throw an error
    const getFavoriteMoviesMock = api.getFavoriteMovies as jest.Mock;
    getFavoriteMoviesMock.mockRejectedValue(new Error('API Error'));
  
    const { getByText } = renderWithProviders(
      <LikeMoviesScreen navigation={mockNavigation} />
    );
  
    await waitFor(() => {
      expect(getByText('No favorite movies yet')).toBeTruthy();
    });
  
    // Restore original console.error
    console.error = originalConsoleError;
  });
});

