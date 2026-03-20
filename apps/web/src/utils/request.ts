export function getErrorMessage(error: unknown, fallback = '请求失败，请稍后再试') {
  const candidate =
    (error as { info?: { data?: { message?: string } } })?.info?.data?.message ||
    (error as { data?: { message?: string } })?.data?.message ||
    (error as { message?: string })?.message;

  return typeof candidate === 'string' && candidate.trim() ? candidate : fallback;
}
