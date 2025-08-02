const whitelist = (process.env.CORS_ORIGIN_WHITELIST || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

export function getAllowedOrigin(origin) {
  return origin && whitelist.includes(origin) ? origin : '';
}
