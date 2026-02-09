export type KakaoPlaceMeta = {
  isEnd: boolean;
  pageableCount: number;
  totalCount: number;
};

export type KakaoPlaceDocument = {
  id: string;
  placeName: string;
  categoryName?: string;
  categoryGroupCode?: string;
  categoryGroupName?: string;
  phone?: string;
  addressName?: string;
  roadAddressName?: string;
  placeUrl?: string;
  x: string;
  y: string;
  distance?: string;
};

export type KakaoPlaceSearchResponse = {
  meta: KakaoPlaceMeta;
  documents: KakaoPlaceDocument[];
};
