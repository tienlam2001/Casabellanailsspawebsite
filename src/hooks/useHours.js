import { useEffect, useState } from 'react';
import { getLocationHours } from '../utils/adminApi';

// Canonical fallback hours — also the source of truth other salon sites (e.g. Lovely Nail & Spa)
// fall back to if their own Firestore doc is unavailable. Keep this in sync with the
// `locationHours/casabella` doc managed from NailsSalonManagement's Firestore Content page.
const DEFAULT_HOURS = {
  monday: '9:30a – 7:00p',
  tuesday: '9:30a – 7:00p',
  wednesday: '9:30a – 7:00p',
  thursday: '9:30a – 7:00p',
  friday: '9:30a – 7:00p',
  saturday: '9:30a – 6:00p',
  sunday: '11:00a – 5:00p',
  note: '',
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
