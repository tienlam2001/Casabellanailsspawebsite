import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import CsvDropzone from '../components/customers/CsvDropzone';
import ImportResults from '../components/customers/ImportResults';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import { logoutAdmin } from '../utils/adminApi';
import { formatNumber } from '../utils/formatters';
import { formatPhone } from '../utils/phone';
import { buildImportPreview, REQUIRED_FIELD_LABELS, OPTIONAL_FIELD_LABELS } from '../utils/customerImport';
import { ensureDefaultLocations, syncImportToFirestore } from '../utils/customerDb';
import ROUTES, { adminCustomerLocationPath } from '../constants/routes';

const ADMIN_SESSION_KEY = 'adminSession';

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsText(file);
  });

const AdminCustomerImport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);

  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState(searchParams.get('location') || '');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState('');

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setDocumentTitle('Import Customers');
    setMetaDescription('Upload a CSV of customer data and sync it to Firebase by location.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  useEffect(() => {
    const load = async () => {
      setLocationsLoading(true);
      try {
        const list = await ensureDefaultLocations();
        setLocations(list);
        if (!selectedLocationId && list.length > 0) {
          setSelectedLocationId(searchParams.get('location') || list[0].id);
        }
      } catch (err) {
        setParseError(err.message || 'Unable to load locations.');
      } finally {
        setLocationsLoading(false);
      }
    };
    load();
    // Runs once on mount only: seeds the initial selection from the ?location= query param.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: ROUTES.adminCustomerImport }} />;
  }

  const onLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
      navigate(ROUTES.adminLogin, { replace: true });
    }
  };

  const onFileSelected = async (nextFile) => {
    setFile(nextFile);
    setPreview(null);
    setParseError('');
    setResult(null);
    setSyncError('');

    if (!nextFile.name.toLowerCase().endsWith('.csv') && nextFile.type !== 'text/csv') {
      setParseError('Please choose a .csv file exported from your POS.');
      return;
    }

    try {
      const text = await readFileAsText(nextFile);
      const nextPreview = buildImportPreview(text);
      setPreview(nextPreview);
      if (nextPreview.missingRequiredHeaders.length > 0) {
        setParseError(
          `CSV is missing required column(s): ${nextPreview.missingRequiredHeaders
            .map((f) => REQUIRED_FIELD_LABELS[f])
            .join(', ')}.`
        );
      }
    } catch (err) {
      setParseError(err.message || 'Unable to parse the CSV file.');
    }
  };

  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);
  const canSync =
    Boolean(selectedLocation) && Boolean(preview) && preview.missingRequiredHeaders.length === 0 && !syncing;

  const onSync = async () => {
    if (!selectedLocation || !preview) return;
    setSyncing(true);
    setSyncError('');
    try {
      const syncResult = await syncImportToFirestore({
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        fileName: file?.name || 'import.csv',
        csvRecordCount: preview.csvRecordCount,
        validRecords: preview.validRecords,
        invalidRows: preview.invalidRows,
      });
      setResult(syncResult);
    } catch (err) {
      setSyncError(
        err.message ||
          'The import failed partway through. It is safe to re-upload the same CSV — matching phone numbers will simply be re-synced.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const onStartOver = () => {
    setFile(null);
    setPreview(null);
    setParseError('');
    setResult(null);
    setSyncError('');
  };

  if (result) {
    return (
      <Section eyebrow="Admin" title="Import Complete" description="Review exactly what changed in Firebase.">
        <ImportResults result={result} />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          <Button type="button" onClick={onStartOver}>Upload Another CSV</Button>
          <Button to={adminCustomerLocationPath(result.locationId)} variant="secondary">View Location</Button>
          <Button to={ROUTES.adminCustomers} variant="secondary">Back to Dashboard</Button>
        </div>
      </Section>
    );
  }

  return (
    <Section
      eyebrow="Admin"
      title="Upload Customer CSV"
      description="Choose Location → Upload CSV → Preview → Sync → Review Changes."
    >
      <Card>
        <FormField label="Location" required helper="Each location keeps a fully separate customer database.">
          {locationsLoading ? (
            <p className="muted" style={{ margin: 0 }}>Loading locations...</p>
          ) : (
            <FormField.Select value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)}>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </FormField.Select>
          )}
        </FormField>

        <div style={{ marginTop: '1.1rem' }}>
          <CsvDropzone file={file} onFileSelected={onFileSelected} disabled={syncing} />
        </div>

        {parseError ? <p className="field-error" style={{ marginTop: '0.9rem' }}>{parseError}</p> : null}
        {syncError ? <p className="field-error" style={{ marginTop: '0.9rem' }}>{syncError}</p> : null}

        <p className="muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
          Required columns: {Object.values(REQUIRED_FIELD_LABELS).join(', ')}. Optional columns:{' '}
          {Object.values(OPTIONAL_FIELD_LABELS).join(', ')} (default to 0 / blank if missing).
        </p>
      </Card>

      {preview && preview.missingRequiredHeaders.length === 0 && (
        <Card style={{ marginTop: '1.25rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Preview</p>
          <div className="cdb-preview-stats">
            <span><strong>{formatNumber(preview.csvRecordCount)}</strong> CSV rows</span>
            <span><strong>{formatNumber(preview.validRecords.length)}</strong> valid customers</span>
            <span><strong>{formatNumber(preview.invalidRows.length)}</strong> invalid rows</span>
            {preview.duplicatePhonesInFile > 0 ? (
              <span><strong>{formatNumber(preview.duplicatePhonesInFile)}</strong> duplicate phone numbers (last row wins)</span>
            ) : null}
          </div>

          <p className="muted" style={{ marginTop: '0.9rem' }}>First rows detected:</p>
          <div className="cdb-table-scroll" style={{ maxHeight: '260px' }}>
            <table className="cdb-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Points</th>
                  <th>Visits</th>
                  <th>Last Visit</th>
                  <th>Spent</th>
                </tr>
              </thead>
              <tbody>
                {preview.validRecords.slice(0, 10).map((row) => (
                  <tr key={row.phoneNumber}>
                    <td>{row.name}</td>
                    <td>{formatPhone(row.phoneNumber)}</td>
                    <td>{row.points}</td>
                    <td>{row.visits}</td>
                    <td>{row.lastVisit || '—'}</td>
                    <td>{row.spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.invalidRows.length > 0 && (
            <p className="muted" style={{ marginTop: '0.9rem' }}>
              {preview.invalidRows.length} row(s) will be skipped — missing or invalid required data.
            </p>
          )}

          <div style={{ marginTop: '1.1rem' }}>
            <Button type="button" onClick={onSync} disabled={!canSync}>
              {syncing ? 'Syncing...' : 'Upload & Sync'}
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
      </div>
    </Section>
  );
};

export default AdminCustomerImport;
