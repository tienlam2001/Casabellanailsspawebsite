import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Section from '../components/Section';
import Button from '../components/Button';
import ImportResults from '../components/customers/ImportResults';
import { getFromStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import { getImportRecord } from '../utils/customerDb';
import ROUTES, { adminCustomerLocationPath } from '../constants/routes';

const ADMIN_SESSION_KEY = 'adminSession';

const AdminCustomerImportDetail = () => {
  const { locationId, importId } = useParams();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setDocumentTitle('Import Details');
    setMetaDescription('Review a past customer CSV import.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getImportRecord(locationId, importId);
        setRecord(data);
      } catch (err) {
        setError(err.message || 'Unable to load this import.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locationId, importId]);

  if (!session?.loggedIn) {
    return (
      <Navigate
        to={ROUTES.adminLogin}
        replace
        state={{ from: `/admin/customers/${locationId}/imports/${importId}` }}
      />
    );
  }

  if (loading) {
    return (
      <Section eyebrow="Admin" title="Loading import..." description="">
        <p className="muted">Loading...</p>
      </Section>
    );
  }

  if (!record) {
    return (
      <Section eyebrow="Admin" title="Import not found" description={error || 'This import record does not exist.'}>
        <Button to={adminCustomerLocationPath(locationId)}>Back to Location</Button>
      </Section>
    );
  }

  return (
    <Section eyebrow="Admin" title="Import Details" description="Historical record of a completed customer CSV import.">
      <div style={{ marginBottom: '1.25rem' }}>
        <Button to={adminCustomerLocationPath(locationId)} variant="secondary">Back to Location</Button>
      </div>
      <ImportResults result={record} />
      {record.truncatedDetails ? (
        <p className="muted" style={{ marginTop: '1rem' }}>
          This was a very large import — detailed per-customer rows are limited to the first batch, though the
          summary counts above are exact.
        </p>
      ) : null}
    </Section>
  );
};

export default AdminCustomerImportDetail;
