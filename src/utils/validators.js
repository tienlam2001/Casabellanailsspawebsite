const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s().-]{7,}$/;

const isEmail = (value) => emailRegex.test(String(value).trim());
const isPhone = (value) => phoneRegex.test(String(value).trim());
const isNotEmpty = (value) => Boolean(String(value || '').trim());

const validateBooking = (form) => {
  const errors = {};
  if (!isNotEmpty(form.fullName)) errors.fullName = 'Name is required';
  if (!isPhone(form.phone)) errors.phone = 'Valid phone is required';
  if (!isEmail(form.email)) errors.email = 'Valid email is required';
  if (!isNotEmpty(form.preferredDate)) errors.preferredDate = 'Date is required';
  if (!isNotEmpty(form.preferredTime)) errors.preferredTime = 'Time is required';
  if (!isNotEmpty(form.serviceCategory))
    errors.serviceCategory = 'Please choose a service';
  return errors;
};

const validateContact = (form) => {
  const errors = {};
  if (!isNotEmpty(form.fullName)) errors.fullName = 'Name is required';
  if (!isPhone(form.phone)) errors.phone = 'Valid phone is required';
  if (!isEmail(form.email)) errors.email = 'Valid email is required';
  if (!isNotEmpty(form.message)) errors.message = 'Message is required';
  return errors;
};

export { isEmail, isPhone, isNotEmpty, validateBooking, validateContact };
