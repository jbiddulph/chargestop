import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set MapBox token from environment variable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapProps = {
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  style?: string;
  height?: string | number; // e.g. '500px', '100vh', or number (pixels)
};

const Map = ({
  initialCenter = [-0.1278, 51.5074], // London as default
  initialZoom = 10,
  style = 'mapbox://styles/mapbox/streets-v11',
  height = '500px',
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSuccess, setGeoSuccess] = useState(false);
  const hasSetInitialLocation = useRef(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const watchRetryCount = useRef(0);
  const maxWatchRetries = 3;
  const lastKnownPosition = useRef<GeolocationPosition | null>(null);
  const retryTimeoutId = useRef<number | null>(null);

  // Check geolocation permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!navigator.geolocation) {
          setGeoError('Geolocation is not supported by your browser.');
          return;
        }

        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionState(result.state);
          
          // If permission is already granted, start tracking immediately
          if (result.state === 'granted') {
            handleGetLocation();
          }
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state);
            if (result.state === 'granted') {
              startLocationTracking();
            } else if (result.state === 'denied') {
              setGeoLoading(false);
              setGeoError('To use location tracking:\n1. Click the location icon in your browser address bar\n2. Select "Allow"\n3. Reload the page');
              // Clean up any existing tracking
              if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
              }
            }
          });
        } else {
          // For browsers that don't support permissions API, try getting location directly
          handleGetLocation();
        }
      } catch (err) {
        console.error('Permission check error:', err);
        // Fallback to direct location request
        handleGetLocation();
      }
    };
    
    checkPermission();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      try {
        // If we have a user location, use that instead of the default center
        const startingCenter = userLocation || initialCenter;
        const startingZoom = userLocation ? 15 : initialZoom;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style,
          center: startingCenter,
          zoom: startingZoom,
        });
        
        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        map.current.on('load', () => {
          setLoading(false);
          map.current?.resize();
        });
        
        map.current.on('error', (e) => {
          setError('Failed to load the map. Please check your MapBox token and network connection.');
          setLoading(false);
        });
      } catch (err: any) {
        setError('Failed to initialize the map.');
        setLoading(false);
      }
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove dependencies to prevent reinitialization

  // Handle user location marker
  useEffect(() => {
    console.log('Location update:', userLocation);
    if (!map.current || !userLocation) {
      console.log('Map or location not ready:', { map: !!map.current, location: userLocation });
      return;
    }

    try {
      if (!userMarker.current) {
        console.log('Creating new marker at:', userLocation);
        // Create marker element with pulse effect
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        
        // Create popup for the marker
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          closeOnClick: false
        })
          .setHTML('<strong>You are here</strong>');

        // Create new marker
        userMarker.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
          draggable: false,
          scale: 1.2,
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport'
        })
          .setLngLat(userLocation)
          .setPopup(popup)
          .addTo(map.current);

        // Show popup by default
        userMarker.current.togglePopup();
        
        // Center map on user location with animation
        map.current.flyTo({
          center: userLocation,
          zoom: 15,
          essential: true,
          duration: 1000
        });
        
        setGeoSuccess(true);
      } else {
        console.log('Updating marker position to:', userLocation);
        userMarker.current.setLngLat(userLocation);
      }
    } catch (error) {
      console.error('Error creating/updating marker:', error);
    }
  }, [userLocation]);

  // Reset hasSetInitialLocation when component unmounts
  useEffect(() => {
    return () => {
      hasSetInitialLocation.current = false;
    };
  }, []);

  // Helper function to update user marker
  const updateUserMarker = (coords: [number, number]) => {
    if (userMarker.current) {
      userMarker.current.setLngLat(coords);
    }
  };

  // Helper function to handle geolocation errors
  const handleGeolocationError = (error: GeolocationPositionError) => {
    console.warn('Geolocation error:', error);
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setGeoError('Location access was denied. Please enable location services and refresh the page.');
        break;
      case error.POSITION_UNAVAILABLE:
        setGeoError('Unable to determine your location. Please check your device settings.');
        break;
      case error.TIMEOUT:
        setGeoError('Location request timed out. Please check your connection and try again.');
        break;
      default:
        setGeoError('An error occurred while tracking your location.');
    }
  };

  const handleGetLocation = () => {
    console.log('Location button clicked');
    // If we're already tracking, center on current location
    if (userLocation && !geoLoading) {
      console.log('Centering on existing location:', userLocation);
      if (map.current) {
        map.current.flyTo({
          center: userLocation,
          zoom: 15,
          essential: true
        });
      }
      return;
    }

    // Otherwise start location tracking
    startLocationTracking();
  };

  const getFallbackOptions = (retryCount: number): PositionOptions => {
    const baseTimeout = 30000;
    return {
      enableHighAccuracy: retryCount < 1,
      timeout: Math.min(baseTimeout + (retryCount * 10000), 60000),
      maximumAge: 2000 + (retryCount * 3000)
    };
  };

  const startWatchingPosition = (retryCount: number = 0) => {
    const watchOptions = getFallbackOptions(retryCount);
    console.log('Starting position watch with options:', watchOptions);
    
    // Clear existing watch if any
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    try {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log('Received position update:', position);
          // Reset retry count on successful position
          watchRetryCount.current = 0;
          lastKnownPosition.current = position;
          
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];
          
          // Only update if position has changed
          if (!userLocation || 
              userLocation[0] !== newLocation[0] || 
              userLocation[1] !== newLocation[1]) {
            console.log('Updating user location to:', newLocation);
            setUserLocation(newLocation);
            setGeoSuccess(true);
          }
          setGeoError(null);
        },
        (error) => {
          console.warn('Watch position error:', error);
          
          // If we have a last known position, keep using it
          if (lastKnownPosition.current) {
            const { latitude, longitude } = lastKnownPosition.current.coords;
            setUserLocation([longitude, latitude]);
          }

          if (error.code === error.TIMEOUT) {
            watchRetryCount.current++;
            
            if (watchRetryCount.current <= maxWatchRetries) {
              // Exponential backoff for retries
              const backoffDelay = Math.min(1000 * Math.pow(2, watchRetryCount.current - 1), 10000);
              
              console.log(`Scheduling retry ${watchRetryCount.current} in ${backoffDelay}ms`);
              retryTimeoutId.current = window.setTimeout(() => {
                console.log(`Retrying watch with fallback options (attempt ${watchRetryCount.current})`);
                startWatchingPosition(watchRetryCount.current);
              }, backoffDelay);
            } else {
              setGeoError('Location tracking is currently unavailable. Please try again later.');
              setGeoLoading(false);
            }
          } else {
            handleGeolocationError(error);
            setGeoLoading(false);
          }
        },
        watchOptions
      );
    } catch (e) {
      console.error('Error starting location watch:', e);
      setGeoError('Unable to start location tracking. Please check your browser settings.');
      setGeoLoading(false);
    }
  };

  const startLocationTracking = () => {
    // Prevent starting multiple tracking sessions
    if (geoLoading || watchId.current !== null) {
      console.log('Location tracking already in progress');
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    console.log('Starting location tracking');
    setGeoLoading(true);
    setGeoError(null);
    watchRetryCount.current = 0;
    
    // Clear any existing watch and retry timeouts
    if (watchId.current !== null) {
      console.log('Clearing existing watch');
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (retryTimeoutId.current !== null) {
      console.log('Clearing existing retry timeout');
      window.clearTimeout(retryTimeoutId.current);
      retryTimeoutId.current = null;
    }

    // Get initial position with high accuracy
    const initialOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 1000
    };

    console.log('Requesting initial position with options:', initialOptions);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Received initial position:', position);
        const { latitude, longitude } = position.coords;
        lastKnownPosition.current = position;
        const newLocation: [number, number] = [longitude, latitude];
        console.log('Setting initial location:', newLocation);
        setUserLocation(newLocation);
        setGeoSuccess(true);
        
        // Start watching with initial settings
        startWatchingPosition(0);
        setGeoLoading(false);
      },
      (error) => {
        console.warn('Initial position error:', error);
        // Start watching anyway, with fallback options
        startWatchingPosition(1);
        handleGeolocationError(error);
      },
      initialOptions
    );
  };

  // Get permission status message
  const getPermissionMessage = () => {
    if (permissionState === 'denied') {
      return 'Location access is blocked. To enable:\n1. Click the location icon in your browser address bar\n2. Select "Allow"\n3. Reload the page';
    }
    if (permissionState === 'prompt') {
      return 'Click the location button to allow access to your location';
    }
    return null;
  };

  // Responsive height logic
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  // Cleanup function
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (retryTimeoutId.current !== null) {
        window.clearTimeout(retryTimeoutId.current);
        retryTimeoutId.current = null;
      }
      hasSetInitialLocation.current = false;
      watchRetryCount.current = 0;
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: containerHeight,
        minHeight: 200,
        position: 'relative',
        flex: 1,
        display: 'flex',
      }}
      className="responsive-map-container"
    >
      <div 
        ref={mapContainer} 
        style={{ 
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
        className="map-container"
      />
      {/* Permission/Instructions toast */}
      {!userLocation && !geoError && !geoLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white px-4 py-2 rounded shadow-lg text-sm animate-fade-in whitespace-pre-line text-center">
          {getPermissionMessage() || 'Click the location button to find charging stations near you'}
        </div>
      )}
      {/* Floating location button */}
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={geoLoading}
        className={`absolute bottom-4 right-4 z-20 ${
          geoLoading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white rounded-full shadow-lg p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400`}
        aria-label="Find my location"
      >
        {geoLoading ? (
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5A6.5 6.5 0 1012 5.5a6.5 6.5 0 000 13zm0 0v2m0-2a6.5 6.5 0 01-6.5-6.5m13 0A6.5 6.5 0 0112 18.5" />
          </svg>
        )}
      </button>
      {/* Success toast */}
      {geoSuccess && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-green-600 text-white px-4 py-2 rounded shadow-lg text-sm animate-fade-in">
          Location tracking active
        </div>
      )}
      {/* Geolocation error toast */}
      {geoError && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-2 rounded shadow-lg text-sm animate-fade-in max-w-xs text-center whitespace-pre-line">
          {geoError}
        </div>
      )}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          <div className="spinner" style={{ width: 48, height: 48, border: '6px solid #ccc', borderTop: '6px solid #333', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style jsx global>{`
            .user-location-marker {
              width: 20px;
              height: 20px;
              background-color: #FFD700;
              border-radius: 50%;
              position: relative;
              cursor: pointer;
              z-index: 1000;
              transform: translate(-50%, -50%);
              pointer-events: auto;
            }
            .user-location-marker::before {
              content: '';
              position: absolute;
              width: 300%;
              height: 300%;
              top: -100%;
              left: -100%;
              background-color: rgba(255, 215, 0, 0.3);
              border-radius: 50%;
              animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              z-index: -1;
              pointer-events: none;
            }
            .user-location-marker::after {
              content: '';
              position: absolute;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
              background-color: #006699;
              border-radius: 50%;
              box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
              animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              z-index: 1;
              pointer-events: none;
            }
            @keyframes pulse-ring {
              0% {
                transform: scale(0.33);
                opacity: 0.8;
              }
              70% {
                transform: scale(1);
                opacity: 0;
              }
              100% {
                transform: scale(0.33);
                opacity: 0;
              }
            }
            @keyframes pulse-dot {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.2);
              }
              100% {
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
          color: 'red',
          fontWeight: 'bold',
          fontSize: 18,
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Map; 