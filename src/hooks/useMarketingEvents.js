import { useEffect, useState } from 'react';
import { getPublicMarketingEvents } from '../utils/adminApi';

const useMarketingEvents = () => {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;
    getPublicMarketingEvents()
      .then((items) => {
        if (!mounted) return;
        const next = Array.isArray(items) ? items : [];
        setEvents(next);
        setStatus(next.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!mounted) return;
        setEvents([]);
        setStatus('error');
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { events, status };
};

export default useMarketingEvents;
