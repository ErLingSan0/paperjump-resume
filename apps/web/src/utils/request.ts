const RAW_ERROR_PATTERNS = [
  /^\d{3}$/,
  /^http\s*\d{3}$/i,
  /^unauthorized$/i,
  /^forbidden$/i,
  /^not found$/i,
  /response error/i,
  /request failed/i,
  /network error/i,
  /failed to fetch/i,
  /http2/i,
];

function isSafeErrorMessage(candidate: unknown) {
  if (typeof candidate !== 'string') {
    return false;
  }

  const normalized = candidate.trim();

  if (!normalized) {
    return false;
  }

  return RAW_ERROR_PATTERNS.every((pattern) => !pattern.test(normalized));
}

export function getErrorStatus(error: unknown) {
  const candidates = [
    (error as { response?: { status?: number } })?.response?.status,
    (error as { info?: { response?: { status?: number } } })?.info?.response?.status,
    (error as { info?: { data?: { status?: number } } })?.info?.data?.status,
    (error as { data?: { status?: number } })?.data?.status,
    (error as { status?: number })?.status,
  ];

  const status = candidates.find((candidate) => typeof candidate === 'number' && Number.isFinite(candidate));
  return typeof status === 'number' ? status : undefined;
}

export function getErrorMessage(
  error: unknown,
  fallback = '请求失败，请稍后再试',
  statusMessages?: Partial<Record<number, string>>,
) {
  const status = getErrorStatus(error);

  if (status && statusMessages?.[status]) {
    return statusMessages[status] as string;
  }

  const structuredCandidate =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as { info?: { data?: { message?: string } } })?.info?.data?.message ||
    (error as { data?: { message?: string } })?.data?.message;

  if (isSafeErrorMessage(structuredCandidate)) {
    return structuredCandidate.trim();
  }

  const looseCandidate =
    (error as { info?: { errorMessage?: string } })?.info?.errorMessage ||
    (error as { message?: string })?.message;

  return isSafeErrorMessage(looseCandidate) ? looseCandidate.trim() : fallback;
}
