import { Link } from 'react-router-dom';
import Button from './Button';
import ROUTES from '../constants/routes';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="space-y-3">
          <p className="brand-title">Casabella Nail & Spa</p>
          <p className="muted">
            Clean, luxurious nail care and spa rituals crafted for Oviedo, Florida.
          </p>
          <Button to={ROUTES.bookingExternal} variant="primary" className="mt-2">
            Book Now
          </Button>
        </div>
        <div>
          <h3 className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            Visit
          </h3>
          <p className="muted">
            <a
              href="https://www.google.com/maps/search/?api=1&query=2871%20Clayton%20Crossing%20Way%20%231033%2C%20Oviedo%2C%20FL%2032765"
              target="_blank"
              rel="noopener noreferrer"
            >
              2871 Clayton Crossing Way #1033, Oviedo, FL 32765
            </a>
            <br /> <br/>
            <a href="tel:+13214446297">(321) 444-6297</a> <br />
            oviedonail@gmail.com
          </p>
        </div>
        <div>
          <h3 className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            Hours
          </h3>
          <p className="muted">
            Mon–Fri: 9:30a – 7:00p <br />
            Sat: 9:30a – 6:00p <br />
            Sun: 11:00a – 5:00p
          </p>
        </div>
        <div>
          <h3 className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            Explore
          </h3>
          <div className="flex flex-col gap-2 muted">
            <Link to={ROUTES.services}>
              Services
            </Link>
            <Link to={ROUTES.gallery}>
              Gallery
            </Link>
            <Link to={ROUTES.promotions}>
              Promotions
            </Link>
            <Link to={ROUTES.blog}>
              Blog
            </Link>
            <Link to={ROUTES.contact}>
              Contact
            </Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Casabella Nail & Spa. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span className="pill">Instagram</span>
          <span className="pill">Facebook</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
