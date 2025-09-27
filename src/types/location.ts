// Location-related type definitions

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends Coordinates {
  address: string;
}

export interface StoreLocation extends LocationData {
  isSet: boolean;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

export interface LocationPickerProps {
  initialLocation?: LocationData;
  onLocationSelected: (location: LocationData) => void;
  onCancel?: () => void;
  title?: string;
  showCurrentLocationButton?: boolean;
}

export interface LocationInputProps {
  value?: LocationData;
  onLocationChange: (location: LocationData) => void;
  placeholder?: string;
  editable?: boolean;
  showMapButton?: boolean;
}

// Google Maps related types
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  coordinate: Coordinates;
  title?: string;
  description?: string;
}

// Geocoding types
export interface GeocodeResult {
  address: string;
  coordinates: Coordinates;
  formattedAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    country?: string;
    postalCode?: string;
  };
}

// Location service error types
export enum LocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  GEOCODING_FAILED = 'GEOCODING_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface LocationError {
  type: LocationErrorType;
  message: string;
  code?: number;
}
