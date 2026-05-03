const Label = ({ label, required, helper }) => (
  <div className="field-label">
    <span>
      {label} {required ? <span style={{ color: 'var(--pine)' }}>*</span> : null}
    </span>
    {helper ? <span style={{ fontSize: '0.85rem', color: 'rgba(31, 41, 51, 0.6)' }}>{helper}</span> : null}
  </div>
);

const FieldError = ({ message }) =>
  message ? <p className="field-error">{message}</p> : null;

const FormField = ({ label, required, error, helper, children }) => (
  <div className="field">
    <Label label={label} required={required} helper={helper} />
    {children}
    <FieldError message={error} />
  </div>
);

const Input = (props) => <input className="field-input" {...props} />;
const TextArea = ({ rows = 4, ...props }) => <textarea rows={rows} className="field-textarea" {...props} />;
const Select = ({ children, ...props }) => (
  <select className="field-select" {...props}>
    {children}
  </select>
);

FormField.Input = Input;
FormField.TextArea = TextArea;
FormField.Select = Select;

export default FormField;
