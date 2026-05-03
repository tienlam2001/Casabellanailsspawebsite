import { useEffect, useState } from 'react';
import staticServices from '../data/services.json';
import { getServices } from '../utils/adminApi';

const useServices = () => {
  const [services, setServices] = useState(staticServices);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remoteServices = await getServices();
        if (!mounted || !Array.isArray(remoteServices) || remoteServices.length === 0) return;
        setServices(remoteServices);
      } catch {
        // Keep static fallback when API is unavailable.
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return services;
};

export default useServices;
