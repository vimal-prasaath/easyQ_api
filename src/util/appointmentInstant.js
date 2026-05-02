/**
 * Build the UTC instant for an appointment from stored date + "HH:MM" wall time
 * in the hospital timezone (default IST via APPOINTMENT_UTC_OFFSET, e.g. +05:30).
 *
 * appointmentDate is typically midnight UTC for the calendar day of the visit;
 * we take the UTC calendar Y-M-D and combine with local wall time + offset.
 */
export function appointmentStartUtcFromParts(
    appointmentDate,
    appointmentTimeStr,
    utcOffset = process.env.APPOINTMENT_UTC_OFFSET || '+05:30'
) {
    const d = new Date(appointmentDate);
    const y = d.getUTCFullYear();
    const mo = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const parts = String(appointmentTimeStr || '').trim().split(':');
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    if (
        Number.isNaN(y) ||
        Number.isNaN(mo) ||
        Number.isNaN(day) ||
        Number.isNaN(hh) ||
        Number.isNaN(mm)
    ) {
        return null;
    }
    const pad = (n) => String(n).padStart(2, '0');
    return new Date(
        `${y}-${pad(mo)}-${pad(day)}T${pad(hh)}:${pad(mm)}:00${utcOffset}`
    );
}
