export type Place = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type PlaceSearchResponse = {
  keyword: string;
  results: Place[];
};
