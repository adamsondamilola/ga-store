function formatNumberToCurrency(number, locale = 'en-NG', currency = 'NGN') {
  if (isNaN(number) || number === null || number === undefined) return "₦0.00";

  const parts = parseFloat(number).toFixed(2).split(".");
  const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₦${whole}.${parts[1]}`;
}

export default formatNumberToCurrency;
