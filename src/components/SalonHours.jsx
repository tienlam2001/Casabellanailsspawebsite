import { useEffect, useState } from 'react';
import useSalonHours, { SalonHoursContext } from '../hooks/useSalonHours';
import { resolveSalonHours, salonDateInZone } from '../shared/salonHours';
import { getPublicSalonHours } from '../utils/adminApi';
import { setLocalBusinessJsonLd } from '../utils/seo';

const fallbackHours = () => resolveSalonHours(null, salonDateInZone());

export const SalonHoursProvider = ({ children }) => {
  const [hours, setHours] = useState(fallbackHours);

  useEffect(() => {
    let mounted = true;
    getPublicSalonHours()
      .then((next) => {
        if (mounted && next) setHours(next);
      })
      .catch(() => {
        if (mounted) setHours(fallbackHours());
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setLocalBusinessJsonLd(hours);
  }, [hours]);

  return (
    <SalonHoursContext.Provider value={hours}>
      {children}
    </SalonHoursContext.Provider>
  );
};

const HoursLines = ({ lines }) => lines.map((line, index) => (
  <span key={line}>
    {index > 0 ? <br /> : null}
    {line}
  </span>
));

const HoursNotice = ({ notice }) => (
  notice ? <p className="hours-notice">{notice}</p> : null
);

const SalonHours = ({ variant = 'lines' }) => {
  const hours = useSalonHours();
  if (variant === 'split') {
    return (
      <div className="salon-hours">
        <div className="salon-hours-split">
          <div>
            <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>Weekdays</p>
            <p className="muted" style={{ margin: 0 }}>
              <HoursLines lines={hours.weekdayLines} />
            </p>
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>Weekends</p>
            <p className="muted" style={{ margin: 0 }}>
              <HoursLines lines={hours.weekendLines} />
            </p>
          </div>
        </div>
        <HoursNotice notice={hours.todayNotice} />
      </div>
    );
  }

  return (
    <div className="salon-hours">
      <p className="muted">
        <HoursLines lines={hours.groups.map((group) => `${group.label}: ${group.hours}`)} />
      </p>
      <HoursNotice notice={hours.todayNotice} />
    </div>
  );
};

export default SalonHours;
