// Server stores money in minor units (paise/cents)
export const money = (minor, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((minor || 0) / 100);

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.';
