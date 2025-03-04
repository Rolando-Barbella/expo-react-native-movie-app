export type Movie = {
  vote_average: number;
  overview: string;
  vote_count: string;
  popularity: number;
  original_title: string;
  id: string;
  genre_ids: Array<number>;
  title: string;
  backdrop_path: string;
  poster_path: string;
  release_date: string;
}; 

export type Genre = {
  id: number;
  name: string;
}
