import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Section from '../components/Section';
import ROUTES from '../constants/routes';
import { setPageSeo } from '../utils/seo';

const LegalPage = ({ type }) => {
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  useEffect(() => {
    setPageSeo({
      title,
      description: `${title} for Casabella Nail & Spa, including our promotional text messaging program.`,
      path: isPrivacy ? ROUTES.privacy : ROUTES.terms,
    });
  }, [isPrivacy, title]);

  return (
    <Section title={title} description="Effective October 9, 2026">
      <Card className="legal-content">
        {isPrivacy ? (
          <>
            <p>Casabella Nail &amp; Spa respects your privacy. This policy explains how we collect and use information you provide through our website and promotional text messaging signup.</p>
            <h3>Information we collect</h3>
            <p>When you join our text program, we collect the name, email address, mobile phone number, consent status, signup source, and signup time you provide.</p>
            <h3>How we use information</h3>
            <p>We use this information to operate the program and send salon specials, seasonal offers, and appointment opportunities. We do not sell or share mobile phone numbers or SMS consent information with third parties for their marketing purposes. We may share information with service providers that help us deliver messages and operate our services.</p>
            <h3>Your choices</h3>
            <p>Reply <strong>STOP</strong> to any promotional text to unsubscribe. Reply <strong>HELP</strong> for help. You may also contact us at <a href="tel:+13214446297">(321) 444-6297</a> or <a href="mailto:oviedonail@gmail.com">oviedonail@gmail.com</a>.</p>
            <h3>Data protection</h3>
            <p>We use reasonable administrative and technical safeguards to protect submitted information. No electronic transmission or storage system is guaranteed to be completely secure.</p>
          </>
        ) : (
          <>
            <p>These terms govern the Casabella Nail &amp; Spa promotional text messaging program.</p>
            <h3>Program description</h3>
            <p>By actively checking the consent box and submitting the signup form, you agree to receive recurring promotional text messages from Casabella Nail &amp; Spa about salon specials, seasonal offers, and appointment opportunities at the mobile number provided.</p>
            <h3>Frequency and charges</h3>
            <p>Message frequency varies. Message and data rates may apply. Your wireless carrier is not responsible for delayed or undelivered messages.</p>
            <h3>Opting out and help</h3>
            <p>Reply <strong>STOP</strong> to unsubscribe. After opting out, you may receive one final confirmation message. Reply <strong>HELP</strong> for help, call <a href="tel:+13214446297">(321) 444-6297</a>, or email <a href="mailto:oviedonail@gmail.com">oviedonail@gmail.com</a>.</p>
            <h3>Consent</h3>
            <p>Consent to receive marketing text messages is not a condition of purchasing any goods or services. You represent that you are the subscriber or customary user of the mobile number provided and are authorized to consent.</p>
          </>
        )}
        <p>For additional details, view our <Link to={isPrivacy ? ROUTES.terms : ROUTES.privacy}>{isPrivacy ? 'Terms of Service' : 'Privacy Policy'}</Link>.</p>
      </Card>
    </Section>
  );
};

export default LegalPage;
