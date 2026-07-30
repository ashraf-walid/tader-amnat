/**
 * Format large numbers with Arabic abbreviations
 */

/**
 * Format number with Arabic abbreviations (thousand = ك، million = م، billion = مليار)
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted number string
 */
export function formatLargeNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  // Handle billions (مليار)
  if (absNum >= 1000000000) {
    const formatted = (absNum / 1000000000).toFixed(decimals);
    return `${sign}${formatted} مليار`;
  }

  // Handle millions (مليون)
  if (absNum >= 1000000) {
    const formatted = (absNum / 1000000).toFixed(decimals);
    return `${sign}${formatted} M`;
  }

  // Handle thousands - only for numbers >= 500,000
  if (absNum >= 500000) {
    const formatted = (absNum / 1000).toFixed(decimals);
    return `${sign}${formatted} K`;
  }

  // Handle regular numbers (less than 500,000)
  return `${sign}${absNum.toLocaleString('en-US')}`;
}

/**
 * Format currency with abbreviations and currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: "ج.م")
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = "ج.م", decimals = 2) {
  const formattedNumber = formatLargeNumber(amount, decimals);
  return `${formattedNumber} ${currency}`;
}

/**
 * Format balance with color coding (positive = green, negative = red)
 * @param {number} balance - The balance amount
 * @param {string} currency - Currency symbol (default: "ج.م")
 * @returns {object} - {text: string, className: string}
 */
export function formatBalance(balance, currency = "ج.م") {
  const formattedAmount = formatCurrency(balance, currency);

  return {
    text: formattedAmount,
    className: balance >= 0 ? "text-green-400" : "text-red-400"
  };
}

/**
 * Get tooltip text with full number for abbreviated values
 * @param {number} num - The original number
 * @returns {string} - Full formatted number for tooltip
 */
export function getFullNumberTooltip(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}