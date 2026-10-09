import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import Gallery from './pages/Gallery';
import Promotions from './pages/Promotions';
import PromotionReminderSignup from './pages/PromotionReminderSignup';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/AdminLogin';
import AdminAdvertise from './pages/AdminAdvertise';
import AdminServices from './pages/AdminServices';
import AdminGallery from './pages/AdminGallery';
import AdminBlog from './pages/AdminBlog';
import AdminPromotionReminders from './pages/AdminPromotionReminders';
import LegalPage from './pages/LegalPage';
import ROUTES from './constants/routes';
import './index.css';

const App = () => (
  <Layout>
    <Routes>
      <Route path={ROUTES.home} element={<Home />} />
      <Route path={ROUTES.services} element={<Services />} />
      <Route path={ROUTES.booking} element={<Booking />} />
      <Route path={ROUTES.gallery} element={<Gallery />} />
      <Route path={ROUTES.promotions} element={<Promotions />} />
      <Route path={ROUTES.promotionReminders} element={<PromotionReminderSignup />} />
      <Route path={ROUTES.terms} element={<LegalPage type="terms" />} />
      <Route path={ROUTES.privacy} element={<LegalPage type="privacy" />} />
      <Route path={ROUTES.blog} element={<BlogList />} />
      <Route path={`${ROUTES.blog}/:slug`} element={<BlogPost />} />
      <Route path={ROUTES.contact} element={<Contact />} />
      <Route path={ROUTES.adminLogin} element={<AdminLogin />} />
      <Route path={ROUTES.adminAdvertise} element={<AdminAdvertise />} />
      <Route path={ROUTES.adminServices} element={<AdminServices />} />
      <Route path={ROUTES.adminGallery} element={<AdminGallery />} />
      <Route path={ROUTES.adminBlog} element={<AdminBlog />} />
      <Route path={ROUTES.adminPromotionReminders} element={<AdminPromotionReminders />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

export default App;
