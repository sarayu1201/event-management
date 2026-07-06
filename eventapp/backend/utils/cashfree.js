const https = require("https");

const getCashfreeHost = () => {
  return process.env.CASHFREE_ENV === "production"
    ? "api.cashfree.com"
    : "sandbox.cashfree.com";
};

const makeRequest = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : "";
    const options = {
      hostname: getCashfreeHost(),
      port: 443,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    };

    if (data && method !== "GET") {
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({
              statusCode: res.statusCode,
              error: parsed,
            });
          }
        } catch (err) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject({
              statusCode: res.statusCode,
              error: body || "Response parsing failed",
            });
          }
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data && method !== "GET") {
      req.write(payload);
    }
    req.end();
  });
};

const createCashfreeOrder = async (orderId, amount, customerDetails, returnUrl) => {
  const orderData = {
    order_id: orderId,
    order_amount: Number(amount),
    order_currency: "INR",
    customer_details: {
      customer_id: String(customerDetails.id),
      customer_email: customerDetails.email,
      customer_phone: customerDetails.phone || "9999999999",
      customer_name: customerDetails.name || "Customer",
    },
    order_meta: {
      return_url: returnUrl,
    },
  };
  return makeRequest("POST", "/pg/orders", orderData);
};

const verifyCashfreeOrder = async (orderId) => {
  return makeRequest("GET", `/pg/orders/${orderId}`);
};

const getCashfreeOrderPayments = async (orderId) => {
  return makeRequest("GET", `/pg/orders/${orderId}/payments`);
};

module.exports = {
  createCashfreeOrder,
  verifyCashfreeOrder,
  getCashfreeOrderPayments,
};
