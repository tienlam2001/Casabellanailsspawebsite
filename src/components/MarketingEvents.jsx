import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import useMarketingEvents from '../hooks/useMarketingEvents';
import { eventTiming, formatSalonDate, salonDate } from '../shared/marketingEvents';

const EventCard = ({ event, today }) => {
  const timing = eventTiming(event, today);
  const start = formatSalonDate(event.startDate);
  const end = formatSalonDate(event.endDate);
  const dates = end && end !== start ? `${start} – ${end}` : start;
  return (
    <article className="promotion-card">
      <div className="promotion-card-media">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={`${event.title} event`} />
        ) : (
          <div className="promotion-card-placeholder" aria-hidden="true">{event.title.slice(0, 1)}</div>
        )}
        <span className={`promotion-status promotion-status-${timing === 'Current' ? 'current' : 'upcoming'}`}>{timing}</span>
      </div>
      <div className="promotion-card-body">
        <p className="promotion-location">{event.type ? `${event.type} · ${event.locationLabel}` : event.locationLabel}</p>
        <h3 className="promotion-card-title">{event.title}</h3>
        {event.description ? <p className="promotion-description">{event.description}</p> : null}
        {dates ? <p className="promotion-dates">{dates}</p> : null}
        {event.offerPath ? (
          <div className="promotion-card-actions">
            <Button to={event.offerPath} variant="secondary">View offer</Button>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export const MarketingEventList = ({ events }) => {
  useEffect(() => {
    if (!events?.length || window.location.hash !== '#events') return;
    document.getElementById('events')?.scrollIntoView({ block: 'start' });
  }, [events]);

  if (!events?.length) return null;
  const today = salonDate();
  return (
    <div className="promotion-list-section" id="events">
      <div className="promotion-list-heading">
        <div>
          <p className="eyebrow">On the calendar</p>
          <h2>Upcoming events</h2>
        </div>
        <span>{events.length} {events.length === 1 ? 'event' : 'events'}</span>
      </div>
      <div className="promotion-grid">
        {events.map((event) => <EventCard key={event.id} event={event} today={today} />)}
      </div>
    </div>
  );
};

const MarketingEvents = () => {
  const { events, status } = useMarketingEvents();
  if (status !== 'ready') return null;
  return <MarketingEventList events={events} />;
};

export const MarketingEventsLink = ({ status }) => {
  if (status !== 'ready') return null;
  return (
    <Link className="mobile-app-action" to="/promotions#events">
      Upcoming Events
    </Link>
  );
};

export default MarketingEvents;
