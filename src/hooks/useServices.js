import { useEffect, useState } from 'react';
import staticServices from '../data/services.json';
import { getServices } from '../utils/adminApi';
import { getVisibleServices } from '../utils/serviceVisibility';

const useServices = () => {
  const [services, setServices] = useState(() => getVisibleServices(staticServices));
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remoteServices = await getServices();
        if (!mounted) return;
        if (!Array.isArray(remoteServices) || remoteServices.length === 0) {
          setServices([]);
          setStatus('empty');
          return;
        }
        setServices(getVisibleServices(remoteServices));
        setStatus('live');
      } catch {
        if (!mounted) return;
        setServices(getVisibleServices(staticServices));
        setStatus('error');
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { services, menuStatus: status };
};

export default useServices;
