// Returns bookable 1-hour interview slots for the next DAYS_AHEAD days,
// restricted to the 6-8am/7-9pm windows, with anything already busy on the
// owner's real Google Calendar filtered out. This is how the owner's
// day-to-day availability changes are respected without touching any code —
// blocking time on the calendar removes it from this list automatically.
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedEmail } from '../_shared/verify-user.ts';
import { queryFreeBusy } from '../_shared/calendar.ts';
import { CALENDAR_ID, generateCandidateSlots, getSlotEnd, formatSlotLabel, DAYS_AHEAD } from '../_shared/availability.ts';

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const email = await getAuthenticatedEmail(req);
  if (!email) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const candidates = generateCandidateSlots(DAYS_AHEAD);
  const timeMin = candidates[0];
  const timeMax = getSlotEnd(candidates[candidates.length - 1]);
  const busy = await queryFreeBusy(CALENDAR_ID, timeMin, timeMax);

  const slots = candidates
    .filter((startIso) => {
      const endIso = getSlotEnd(startIso);
      return !busy.some((b) => overlaps(startIso, endIso, b.start, b.end));
    })
    .map((startIso) => ({ startIso, label: formatSlotLabel(startIso) }));

  return new Response(JSON.stringify({ slots }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
