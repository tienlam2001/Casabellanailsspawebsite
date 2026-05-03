import { Link } from 'react-router-dom';

const Button = ({ variant = 'primary', to, icon: Icon, children, className, ...props }) => {
  const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
};

export default Button;
