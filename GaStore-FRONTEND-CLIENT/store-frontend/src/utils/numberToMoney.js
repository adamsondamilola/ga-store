function formatNumberToCurrency(number, locale = 'en-NG', currency = 'NGN') {
  if (isNaN(number) || number === null || number === undefined) return "₦0";

  const whole = parseInt(number)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `₦${whole}`;
}

export default formatNumberToCurrency;