/**
 * Input Validation Utilities
 *
 * Architecture Decision:
 * All user input validation is centralized here to:
 * - Ensure consistent validation rules across the app
 * - Prevent invalid data from reaching smart contracts
 * - Provide clear, reusable type guards for addresses
 *
 * These validators should be called before any transaction signing
 * to fail fast with user-friendly errors.
 */

import { isAddress } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ENS_REGEX = /^[a-zA-Z0-9-]+\.eth$/;

export function isValidAddress(address: string): boolean {
  // Accept valid 0x addresses (excluding zero address)
  if (isAddress(address)) {
    return address.toLowerCase() !== ZERO_ADDRESS;
  }
  // Accept ENS names (e.g., vitalik.eth)
  return ENS_REGEX.test(address);
}

export function isValidEthAddress(address: string): address is `0x${string}` {
  return isAddress(address) && address.toLowerCase() !== ZERO_ADDRESS;
}

export function isValidAmount(amount: string): boolean {
  if (!amount || amount.trim() === "") return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function isValidTokenAmount(
  amount: string,
  decimals: number,
  maxAmount?: string
): boolean {
  if (!isValidAmount(amount)) return false;

  // Check decimal places don't exceed token decimals
  const parts = amount.split(".");
  if (parts[1] && parts[1].length > decimals) return false;

  // Check against max if provided
  if (maxAmount) {
    const amountNum = parseFloat(amount);
    const maxNum = parseFloat(maxAmount);
    if (amountNum > maxNum) return false;
  }

  return true;
}
