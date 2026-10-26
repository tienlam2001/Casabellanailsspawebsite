import { useEffect, useState } from 'react';
import { getLocationHours } from '../utils/adminApi';

// Canonical fallback hours — also the source of truth other salon sites (e.g. Lovely Nail & Spa)
// fall back to if their own Firestore doc is unavailable. Keep this in sync with the
// `locationHours/casabella` doc managed from NailsSalonManagement's Firestore Content page.
const DEFAULT_HOURS = {
  monday: '11:00a – 7:00p',
  tuesday: '9:30a – 7:00p',
  wednesday: '9:30a – 7:00p',
  thursday: '9:30a – 7:00p',
  friday: '9:30a – 7:00p',
  saturday: '9:30a – 6:00p',
  sunday: '11:00a – 5:00p',
  note: '',
};

const WEEKDAYS = [
  ['monday', 'Mon'],
  ['tuesday', 'Tue'],
  ['wednesday', 'Wed'],
  ['thursday', 'Thu'],
  ['friday', 'Fri'],
];

// Groups Mon-Fri into ranges of consecutive days that share the same hours, e.g.
// [{ label: 'Mon', value: '11:00a – 7:00p' }, { label: 'Tue–Fri', value: '9:30a – 7:00p' }]
// instead of assuming every weekday is identical.
export const weekdayGroups = (hours) => {
  const groups = [];
  for (const [key, label] of WEEKDAYS) {
    const value = hours[key];
    const last = groups[groups.length - 1];
    if (last && last.value === value) {
      last.label = `${last.label.split('–')[0]}–${label}`;
    } else {
      groups.push({ label, value });
    }
  }
  return groups;
};

const useHours = () => {
  const [hours, setHours] = useState(DEFAULT_HOURS);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remote = await getLocationHours();
        if (!mounted || !remote) return;
        setHours((prev) => ({ ...prev, ...remote }));
      } catch {
        // Keep the default fallback when Firestore is unavailable.
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return hours;
};

export default useHours;
