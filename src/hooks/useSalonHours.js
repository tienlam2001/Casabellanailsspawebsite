import { createContext, useContext } from 'react';
import { resolveSalonHours, salonDateInZone } from '../shared/salonHours';

const fallbackHours = () => resolveSalonHours(null, salonDateInZone());

export const SalonHoursContext = createContext(fallbackHours());

const useSalonHours = () => useContext(SalonHoursContext);

export default useSalonHours;
