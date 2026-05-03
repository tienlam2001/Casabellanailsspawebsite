const DirectionsHeader = () => {
  const address = '2871 Clayton Crossing Way #1033, Oviedo, FL 32765';
  const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  return (
    <div className="directions-header">
      <div className="container directions-inner">
        <a href={mapLink} target="_blank" rel="noopener noreferrer" className="directions-link">
          {address}
        </a>
        <span className="directions-sep" aria-hidden="true" />
        <a href={mapLink} target="_blank" rel="noopener noreferrer" className="directions-link">
          Get Directions
        </a>
        <span className="directions-sep" aria-hidden="true" />
        <a href="tel:+13214446297" className="directions-link">
          (321) 444-6297
        </a>
      </div>
    </div>
  );
};

export default DirectionsHeader;
