export interface CapturePinRequest {
  requestId: string;
  pinId: string;
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  clientCapturedAt: string;
}

export interface NormalizedCapturePinRequest extends CapturePinRequest {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  clientCapturedAt: string;
}

export interface RewardBoundaryDescription {
  rewardCalculationAuthority: "server-only";
  clientRewardInputsAccepted: false;
  authoritativeWritesAcceptedFromClient: false;
}

export const captureRewardBoundary: RewardBoundaryDescription = {
  rewardCalculationAuthority: "server-only",
  clientRewardInputsAccepted: false,
  authoritativeWritesAcceptedFromClient: false
};

export type CaptureEligibilityDeferredCode =
  "authoritative-pin-verification-unavailable";

export interface CaptureEligibilityDeferredDecision {
  outcome: "deferred";
  code: CaptureEligibilityDeferredCode;
  message: string;
}

export type CaptureEligibilityDecision = CaptureEligibilityDeferredDecision;

export interface CapturePinDeferredResponse {
  ok: false;
  accepted: false;
  replayed: boolean;
  rewardGranted: false;
  status: "eligibility-deferred";
  code: CaptureEligibilityDeferredCode;
  message: string;
  requestId: string;
  pinId: string;
}
