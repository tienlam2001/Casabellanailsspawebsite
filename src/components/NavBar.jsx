import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Button from './Button';
import ROUTES from '../constants/routes';

const links = [
  { to: ROUTES.home, label: 'Home' },
  { to: ROUTES.services, label: 'Services' },
  { to: ROUTES.bookingExternal, label: 'Booking' },
  { to: ROUTES.gallery, label: 'Gallery' },
  { to: ROUTES.blog, label: 'Blog' },
  { to: ROUTES.contact, label: 'Contact' },
];

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const linkClasses = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to={ROUTES.home} className="brand" onClick={close}>
          <span className="brand-mark">C</span>
          <div className="brand-text">
            <p className="brand-title">Casabella</p>
            <p className="brand-subtitle">Nail & Spa</p>
          </div>
        </Link>
        <nav className="nav-links">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses} onClick={close}>
              {link.label}
            </NavLink>
          ))}
          <Button to={ROUTES.bookingExternal} variant="primary">
            Book Now
          </Button>
        </nav>
        <button
          className="nav-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? '×' : '≡'}
        </button>
      </div>
      <div className={`container nav-mobile ${open ? 'open' : ''}`}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClasses} onClick={close}>
            {link.label}
          </NavLink>
        ))}
        <Button to={ROUTES.bookingExternal} variant="primary">
          Book Now
        </Button>
      </div>
    </header>
  );
};

export default NavBar;
