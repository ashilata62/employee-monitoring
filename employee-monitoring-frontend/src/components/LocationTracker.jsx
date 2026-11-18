import { useEffect } from 'react';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';

export function LocationTracker() {
    const { trackMyLocation } = useLocationStore();
    const { role } = useAuthStore();

    useEffect(() => {
        // Only track for EMPLOYEES
        if (role !== 'EMPLOYEE') return;

        const track = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        trackMyLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            source: 'Browser'
                        });
                    },
                    (error) => {
                        // User denied geolocation or unavailable on desktop — silently ignore
                        if (error?.code !== 1) {
                            console.warn("Geolocation notice:", error?.message);
                        }
                    },
                    { enableHighAccuracy: true }
                );
            }
        };

        // Track immediately on mount
        track();

        // Then every 60 seconds
        const intervalId = setInterval(track, 60000);

        return () => clearInterval(intervalId);
    }, [role, trackMyLocation]);

    return null; // This is a background tracker
}
