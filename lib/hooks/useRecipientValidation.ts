/**
 * Recipient Validation Hook
 * 
 * Handles ENS name resolution and address validation for send flow.
 * Extracted from AddressStep to promote reusability and testability.
 */

import { useEnsAddress } from "wagmi";
import { normalize } from "viem/ens";
import { isAddress } from "viem";

export interface UseRecipientValidationResult {
  /** Whether the input is a valid Ethereum address or ENS name */
  isValid: boolean;
  /** Resolved Ethereum address (if ENS) or the input address */
  resolvedAddress: string | undefined;
  /** Whether ENS resolution is in progress */
  isResolving: boolean;
  /** ENS resolution error (if any) */
  error: Error | null;
  /** Normalized ENS name (with .eth suffix) */
  normalizedName: string | undefined;
}

/**
 * Validates recipient input and resolves ENS names to Ethereum addresses.
 * 
 * Validation rules:
 * - 0x addresses: Must be valid Ethereum addresses (42 chars, hex)
 * - .eth domains: Resolved via ENS on mainnet
 * - Potential ENS names: Auto-append .eth and resolve (min 3 chars)
 * 
 * @param recipient - User input (address or ENS name)
 * @returns Validation result with resolved address
 */
export function useRecipientValidation(recipient: string): UseRecipientValidationResult {
  // Normalize ENS name using UTS-46 standard
  const normalizedName = (() => {
    if (!recipient) return undefined;
    
    // Don't try ENS for 0x addresses
    if (recipient.startsWith("0x")) return undefined;
    
    // Already has .eth suffix
    if (recipient.endsWith(".eth")) {
      try {
        return normalize(recipient);
      } catch {
        return undefined;
      }
    }
    
    // Auto-append .eth for potential ENS names (min 3 chars)
    if (recipient.length >= 3) {
      try {
        return normalize(`${recipient}.eth`);
      } catch {
        return undefined;
      }
    }
    
    return undefined;
  })();

  // Resolve ENS name to address on mainnet
  const { 
    data: resolvedAddress, 
    isLoading: isResolving, 
    isFetching,
    error: ensError 
  } = useEnsAddress({
    name: normalizedName,
    chainId: 1, // Mainnet only
    query: {
      enabled: !!normalizedName,
      staleTime: 1000 * 60 * 5, // Cache 5 minutes
      gcTime: 1000 * 60 * 60, // Keep in cache 1 hour
      retry: 2,
      retryDelay: 1000,
    },
  });

  // Determine if input is valid
  const isValid = (() => {
    if (!recipient) return false;
    
    // Valid 0x address
    if (recipient.startsWith("0x")) {
      return isAddress(recipient);
    }
    
    // Valid .eth domain
    if (recipient.endsWith(".eth")) {
      return !!normalizedName;
    }
    
    // Potential ENS name (will auto-resolve)
    return recipient.length >= 3 && /^[a-zA-Z0-9-]+$/.test(recipient);
  })();

  return {
    isValid,
    resolvedAddress: resolvedAddress ?? (recipient.startsWith("0x") && isAddress(recipient) ? recipient : undefined),
    isResolving: isResolving || isFetching,
    error: ensError,
    normalizedName,
  };
}
