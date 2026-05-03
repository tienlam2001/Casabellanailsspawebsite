import DirectionsHeader from './DirectionsHeader';
import NavBar from './NavBar';
import Footer from './Footer';
import WelcomeOfferPopup from './WelcomeOfferPopup';

const Layout = ({ children }) => (
  <div className="layout">
    <DirectionsHeader />
    <NavBar />
    <WelcomeOfferPopup />
    <main className="main-content">{children}</main>
    <Footer />
  </div>
);

export default Layout;
