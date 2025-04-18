import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { NavigationProp } from '@react-navigation/native';
import { Genre, Movie } from '@/app/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as api from '../../lib/api';

// Mock the API module
jest.mock('../../lib/api', () => ({
  getGenres: jest.fn(),
  getMovies: jest.fn(),
}));

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

// Mock the network context
jest.mock('../../lib/NetworkContext', () => ({
  useNetwork: jest.fn().mockReturnValue({ isConnected: true }),
  NetworkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Create a new QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
  },
});

// Render with all necessary providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to prevent error logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    jest.restoreAllMocks();
  });

  it('renders loading indicator while fetching data', async () => {
    // Setup API mocks to return promises that never resolve
    const getGenresMock = api.getGenres as jest.Mock;
    const getMoviesMock = api.getMovies as jest.Mock;
    
    getGenresMock.mockReturnValue(new Promise(() => {}));
    getMoviesMock.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<HomeScreen navigation={mockNavigation} />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders genres and movies after successful data fetching', async () => {
    // Setup API mocks to return successful data
    const getGenresMock = api.getGenres as jest.Mock;
    const getMoviesMock = api.getMovies as jest.Mock;
    
    getGenresMock.mockResolvedValue(mockGenres);
    getMoviesMock.mockResolvedValue(mockMovies);
  
    renderWithProviders(<HomeScreen navigation={mockNavigation} />);
  
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
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
    // Setup API mocks to return errors
    const getGenresMock = api.getGenres as jest.Mock;
    const getMoviesMock = api.getMovies as jest.Mock;
    
    getGenresMock.mockRejectedValue(new Error('Network error'));
    getMoviesMock.mockResolvedValue(mockMovies);

    renderWithProviders(<HomeScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeTruthy();
    });

    expect(screen.getByText('Retry')).toBeTruthy();
  });
});