const rateLimitStore = {};

const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = [];
    }

    // Filter out timestamps older than windowMs
    rateLimitStore[ip] = rateLimitStore[ip].filter((time) => now - time < windowMs);

    if (rateLimitStore[ip].length >= limit) {
      return res.status(429).json({
        message: "Too many requests from this IP, please try again after 15 minutes."
      });
    }

    rateLimitStore[ip].push(now);
    next();
  };
};

const sanitizeInput = (req, res, next) => {
  const sanitize = (val) => {
    if (typeof val === "string") {
      // Basic XSS sanitization
      return val
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "");
    }
    if (typeof val === "object" && val !== null) {
      for (const k in val) {
        val[k] = sanitize(val[k]);
      }
    }
    return val;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

module.exports = { rateLimiter, sanitizeInput };
