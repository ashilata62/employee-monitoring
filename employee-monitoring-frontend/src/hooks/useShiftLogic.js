import { useAlertsStore } from '../store/alertsStore';

export function useShiftLogic() {
    const { alertsSettings } = useAlertsStore();
    const { earliestClockIn, latestClockOut, tolerance } = alertsSettings.shiftScheduling;

    const checkShiftStatus = (scheduledStart, scheduledEnd, actualStart, actualEnd) => {
        const status = {
            warning: false,
            overtime: false,
            incomplete: false,
            message: ''
        };

        if (!actualStart) {
            status.incomplete = true;
            status.message = 'Absent';
            return status;
        }

        const scheduledStartTime = new Date(`2026-01-01T${scheduledStart}`);
        const scheduledEndTime = new Date(`2026-01-01T${scheduledEnd}`);
        const actualStartTime = new Date(`2026-01-01T${actualStart}`);
        const actualEndTime = actualEnd ? new Date(`2026-01-01T${actualEnd}`) : null;

        // Earliest Clock In Check
        const earliestAllowed = new Date(scheduledStartTime.getTime() - (earliestClockIn * 60000));
        if (actualStartTime < earliestAllowed) {
            status.warning = true;
            status.message = 'Early Clock-in';
        }

        // Latest Clock Out Check
        if (actualEndTime) {
            const latestAllowed = new Date(scheduledEndTime.getTime() + (latestClockOut * 60000));
            if (actualEndTime > latestAllowed) {
                status.overtime = true;
                status.message = 'Unauthorized Overtime';
            }

            // Incomplete Shift Check (Tolerance)
            const scheduledDuration = (scheduledEndTime - scheduledStartTime) / 60000;
            const actualDuration = (actualEndTime - actualStartTime) / 60000;
            if (actualDuration < (scheduledDuration - tolerance)) {
                status.incomplete = true;
                status.message = 'Incomplete Shift';
            }
        }

        return status;
    };

    return { checkShiftStatus };
}
