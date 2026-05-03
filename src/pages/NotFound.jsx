import { useEffect } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { setDocumentTitle, setMetaDescription } from '../utils/seo';

const NotFound = () => {
  useEffect(() => {
    setDocumentTitle('Page not found');
    setMetaDescription('The page you are looking for is unavailable. Return to Casabella Nail & Spa in Oviedo, Florida.');
  }, []);

  return (
    <div>
      <Section title="Page not found" description="Let us guide you back to the Casabella Nail & Spa experience.">
        <Card>
          <p className="muted">
            The page you tried to reach does not exist. Browse services or book an appointment in Oviedo, Florida.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button to={ROUTES.home}>Return Home</Button>
            <Button to={ROUTES.bookingExternal} variant="secondary">
              Book Now
            </Button>
          </div>
        </Card>
      </Section>
    </div>
  );
};

export default NotFound;
