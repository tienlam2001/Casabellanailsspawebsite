import { useLocation } from 'react-router-dom';
import DirectionsHeader from './DirectionsHeader';
import NavBar from './NavBar';
import Footer from './Footer';
import SiteMascot from './SiteMascot';
import ROUTES from '../constants/routes';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === ROUTES.home;

  return (
    <div className={`layout ${isHome ? 'layout-home' : ''}`}>
      <div className="ambient-border" aria-hidden="true" />
      <DirectionsHeader />
      <NavBar />
      <SiteMascot />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
