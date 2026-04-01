const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!global.rateLimitMap) {
    global.rateLimitMap = new Map();
  }

  const record = global.rateLimitMap.get(ip);

  if (!record) {
    global.rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (now > record.resetTime) {
    global.rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count += 1;
  next();
};

// Cleanup old entries every 30 minutes
if (global.rateLimitCleanupInterval) {
  clearInterval(global.rateLimitCleanupInterval);
}
global.rateLimitCleanupInterval = setInterval(() => {
  if (!global.rateLimitMap) return;
  const now = Date.now();
  for (const [ip, record] of global.rateLimitMap.entries()) {
    if (now > record.resetTime) {
      global.rateLimitMap.delete(ip);
    }
  }
}, 30 * 60 * 1000);

module.exports = rateLimiter;
