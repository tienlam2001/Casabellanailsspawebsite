const baseTitle = 'Casabella Nail & Spa | Oviedo, Florida';

const setDocumentTitle = (title) => {
  if (typeof document === 'undefined') return;
  document.title = title ? `${title} | Casabella Nail & Spa` : baseTitle;
};

const setMetaDescription = (description) => {
  if (typeof document === 'undefined') return;
  const tag =
    document.querySelector('meta[name="description"]') ||
    (() => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
      return meta;
    })();
  tag.content = description || 'Casabella Nail & Spa in Oviedo, Florida offers luxury nail care, spa pedicures, and relaxing treatments in a pristine, modern setting.';
};

const setRobotsMeta = (content = 'index, follow') => {
  if (typeof document === 'undefined') return;
  const tag =
    document.querySelector('meta[name="robots"]') ||
    (() => {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      return meta;
    })();
  tag.content = content;
};

export { setDocumentTitle, setMetaDescription, setRobotsMeta };
