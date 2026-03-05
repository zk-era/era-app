/**
 * Formatting utilities for consistent display across the app
 */

/**
 * Format gas-related USD values with 5 decimal places
 * Gas costs can be fractions of a cent (especially on testnets like Sepolia),
 * so 5 decimals ensure accurate visibility of actual costs.
 * 
 * Best practice: Use high precision for cost transparency, especially when
 * demonstrating savings. Users testing on low-gas testnets need to see real values.
 * 
 * Examples:
 * - "0.00012" -> "$0.00012" (typical Sepolia with 0 base fee)
 * - "0.19" -> "$0.19000"
 * - "0.543" -> "$0.54300"
 * - "48.75" -> "$48.75000"
 */
export function formatGasUsd(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return "$0.00000";
  }
  
  return numValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

/**
 * Format token amounts (2 decimals for USD values, up to 6 for token amounts)
 */
export function formatTokenAmount(value: number, decimals: number = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format USD values (2 decimals for standard amounts)
 */
export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format number with commas for readability
 * Example: 1234567.89 → "1,234,567.89"
 */
export function formatWithCommas(value: string): string {
  if (!value) return "0";
  const parts = value.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
