import { useState, useEffect } from 'react';
import { formatSecondsToHMS } from '../utils/timeFormat';

/**
 * Live ticking h-m-s display. When enabled, adds 1 second per real second.
 */
export function useLiveTimeDisplay(baseSeconds, enabled = false) {
    const [base, setBase] = useState(() => Math.max(0, Math.floor(baseSeconds || 0)));
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        setBase(Math.max(0, Math.floor(baseSeconds || 0)));
        setElapsed(0);
    }, [baseSeconds]);

    useEffect(() => {
        if (!enabled) {
            setElapsed(0);
            return undefined;
        }
        const id = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(id);
    }, [enabled]);

    return formatSecondsToHMS(base + elapsed);
}
