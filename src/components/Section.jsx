const Section = ({ id, eyebrow, title, description, children, className = '' }) => (
  <section id={id} className={`section reveal ${className}`}>
    <div className="container section-inner">
      {(eyebrow || title || description) && (
        <header className="section-header reveal reveal-delay-1">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          {title ? <h2 className="section-title">{title}</h2> : null}
          {description ? <p className="section-description">{description}</p> : null}
        </header>
      )}
      {children}
    </div>
  </section>
);

export default Section;
