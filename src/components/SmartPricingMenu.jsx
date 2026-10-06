import { useId, useState } from 'react';
import { searchServices } from '../utils/serviceSearch';
import ROUTES from '../constants/routes';

const suggestions = ['Manicure', 'Pedicure', 'Gel', 'Dip', 'Waxing'];

export default function SmartPricingMenu({ services }) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const results = searchServices(services, query);
  const hasQuery = Boolean(query.trim());

  return (
    <section className="smart-pricing" id="smart-pricing" aria-labelledby={`${inputId}-title`}>
      <p className="eyebrow">Find your next service</p>
      <h2 id={`${inputId}-title`}>Smart Pricing Menu</h2>
      <p>Type a service to compare your choices and starting prices.</p>
      <label htmlFor={inputId}>What service are you looking for?</label>
      <div className="smart-pricing-input">
        <input id={inputId} type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Try gel, pedi, dip, or acrylic…" autoComplete="off" maxLength={100}
          aria-controls={`${inputId}-results`} />
        {hasQuery ? <button type="button" onClick={() => setQuery('')}>Clear</button> : null}
      </div>
      <div className="smart-pricing-suggestions" aria-label="Popular searches">
        {suggestions.map((term) => <button key={term} type="button" onClick={() => setQuery(term)}>{term}</button>)}
      </div>
      <p className="smart-pricing-status" role="status">
        {hasQuery ? `${results.length} ${results.length === 1 ? 'choice' : 'choices'} for “${query.trim()}”` : 'Choose a popular search or type above.'}
      </p>
      <div id={`${inputId}-results`} className="smart-pricing-results">
        {hasQuery && !results.length ? <p>No matching services. Try “manicure” or “pedicure,” or <a href="tel:+13214446297">call us for help</a>.</p> : null}
        {results.map((service) => (
          <details key={`${service.category}:${service.name}`} className="smart-pricing-choice">
            <summary><span><small>{service.category}</small><strong>{service.name}</strong></span><span className="smart-pricing-price">From ${service.priceFrom}<small>View details</small></span></summary>
            <div className="smart-pricing-details">
              <p>{service.shortDescription}</p>
              <p>{service.duration}</p>
              <a href={ROUTES.bookingExternal} className="btn btn-secondary">Book Online</a>
            </div>
          </details>
        ))}
      </div>
      <p className="smart-pricing-note">Starting prices shown. Final pricing depends on your service and add-ons.</p>
    </section>
  );
}
