import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MovieCarousel from '../../components/MovieCarusel';

describe('<MovieCarousel />', () => {
  
  const mockGenre = { name: 'Action', id: 1 };
  const mockMovies = [
    { id: '1', title: 'Movie 1', poster_path: '/poster1.jpg' },
    { id: '2', title: 'Movie 2', poster_path: '/poster2.jpg' },
  ];
  
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays the genre name', () => {
    const { getByText } = render(
      <MovieCarousel key={1} genre={mockGenre} movies={mockMovies} navigation={mockNavigation} />
    );

    expect(getByText('Action')).toBeTruthy();
  });

  it('renders movies in the FlatList', () => {
    const { getByText, getAllByTestId } = render(
      <MovieCarousel key={2} genre={mockGenre} movies={mockMovies} navigation={mockNavigation} />
    );

    expect(getByText('Movie 1')).toBeTruthy();
    expect(getByText('Movie 2')).toBeTruthy();

    const movieCards = getAllByTestId('movie-card');
    expect(movieCards.length).toBe(mockMovies.length);
  });

  it('navigates to the detail screen when a movie is pressed', () => {
    const { getByText } = render(
      <MovieCarousel key={3} genre={mockGenre} movies={mockMovies} navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Movie 1'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Detail', {
      movie: mockMovies[0],
      genre: mockGenre,
    });
  });
});
