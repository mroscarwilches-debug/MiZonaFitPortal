// Minimal Google Calendar client used for the booking system: check free/busy
// on the owner's real calendar, and create the interview event (with a
// Google Meet link) once a client confirms a slot.
import { getGoogleAccessToken } from './google-auth.ts';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export async function queryFreeBusy(calendarId: string, timeMinIso: string, timeMaxIso: string): Promise<Array<{ start: string; end: string }>> {
  const token = await getGoogleAccessToken();
  const response = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin: timeMinIso, timeMax: timeMaxIso, items: [{ id: calendarId }] }),
  });
  if (!response.ok) throw new Error(`Calendar freeBusy error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.calendars?.[calendarId]?.busy ?? [];
}

export async function createEvent(calendarId: string, event: {
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  attendeeEmail: string;
}): Promise<{ htmlLink: string; meetLink: string | null }> {
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all&conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startIso },
        end: { dateTime: event.endIso },
        attendees: [{ email: event.attendeeEmail }],
        conferenceData: {
          createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
        },
      }),
    }
  );
  if (!response.ok) throw new Error(`Calendar insert error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const meetLink = data.conferenceData?.entryPoints?.find((e: { entryPointType: string }) => e.entryPointType === 'video')?.uri ?? null;
  return { htmlLink: data.htmlLink, meetLink };
}
