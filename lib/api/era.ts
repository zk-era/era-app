/**
 * ERA Protocol API Client
 * Handles communication with the ERA backend for POC demonstrations
 */

const ERA_API_BASE = process.env.NEXT_PUBLIC_ERA_API_URL || "http://localhost:3000";

export interface POCSubmitRequest {
  from: string;
  to: string;
  token: string;
  amount: string;
  signature: string;
  chainId: number;
  nonce: number;
  deadline: number;
}

export interface POCSubmitResponse {
  jobId: string;
  status: string;
  message: string;
  pollUrl: string;
  createdAt: string;
}

export interface POCJobStatus {
  jobId: string;
  status: "pending" | "fetching_padding" | "building_batch" | "generating_proof" | "settling" | "completed" | "failed";
  progress: number;
  message: string;
  result?: POCResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POCResult {
  batchId: string;
  settlementTxHash: string;
  etherscanUrl: string;
  proofDigest: string;
  gasComparison: {
    directL1Gas: number;
    eraGas: number;
    savedGas: number;
    savingsPercent: number;
    directL1CostUsd: string;
    eraCostUsd: string;
    savedUsd: string;
  };
  batchDetails: {
    totalTransactions: number;
    userTransactionIndex: number;
    paddingTransactions: number;
  };
  timing: {
    paddingFetchMs: number;
    proofGenerationMs: number;
    settlementMs: number;
    totalMs: number;
  };
}

export interface POCInfo {
  service: string;
  version: string;
  network: string;
  chainId: number;
  batchSize: number;
  supportedTokens: Array<{
    symbol: string;
    address: string;
    decimals: number;
    faucet: string;
  }>;
  contracts: {
    verifier: string;
    settlement: string;
  };
  available: boolean;
}

export interface POCEstimate {
  directL1CostUsd: string;
  eraCostUsd: string;
  savingsUsd: string;
  savingsPercent: number;
  gasPriceGwei: string;
  ethPriceUsd: number;
  directL1Gas: number;
  eraGasPerTx: number;
}

class ERAApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = ERA_API_BASE) {
    this.baseUrl = baseUrl;
    this.authToken = process.env.NEXT_PUBLIC_ERA_API_TOKEN;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get POC service info and supported tokens
   */
  async getInfo(): Promise<POCInfo> {
    return this.fetch<POCInfo>("/v1/poc/info");
  }

  /**
   * Get live gas cost estimates
   */
  async getEstimate(): Promise<POCEstimate> {
    return this.fetch<POCEstimate>("/v1/poc/estimate");
  }

  /**
   * Get the current nonce for an address (for EIP-712 signing)
   */
  async getNonce(address: string): Promise<number> {
    const response = await this.fetch<{ nonce: number }>(`/v1/poc/nonce/${address}`);
    return response.nonce;
  }

  /**
   * Submit a transaction for POC batching, proving, and settlement
   */
  async submitTransaction(request: POCSubmitRequest): Promise<POCSubmitResponse> {
    return this.fetch<POCSubmitResponse>("/v1/poc/submit", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<POCJobStatus> {
    return this.fetch<POCJobStatus>(`/v1/poc/status/${jobId}`);
  }

  /**
   * Poll job status until completion or failure
   */
  async pollJobStatus(
    jobId: string,
    onUpdate: (status: POCJobStatus) => void,
    intervalMs: number = 2000,
    maxAttempts: number = 180 // 6 minutes max
  ): Promise<POCJobStatus> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getJobStatus(jobId);
      onUpdate(status);

      if (status.status === "completed" || status.status === "failed") {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      attempts++;
    }

    throw new Error("Job polling timed out");
  }
}

export const eraApi = new ERAApiClient();
