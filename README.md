# ShopNest: Secure Multi-Role E-Commerce Platform (MS Capstone)

A MERN-stack marketplace with four roles (customer, retailer, delivery, admin), dual payment gateways
(Razorpay and Stripe), rotating refresh-token authentication and an idempotent payment pipeline.

## 1. Suggested capstone title and problem statement
**"Design and Evaluation of a Fault-Tolerant, Secure Multi-Vendor E-Commerce Platform with Dual Payment Gateway Integration"**

Small retailers lose sales to failed or duplicated payments, oversold stock and weak account security.
This project builds a marketplace that (a) never charges twice, never loses a paid order, and never oversells,
and (b) enforces least-privilege access for every role.

### Objectives
1. Role-based marketplace: customers buy, retailers (admin-approved) sell, delivery agents close orders, admins govern.
2. Gateway-agnostic payments: Razorpay (UPI/cards/netbanking) and Stripe (global cards) behind one settlement function.
3. Security: short-lived JWT access tokens, rotating httpOnly refresh tokens with reuse detection, RBAC, lockout, NoSQL-injection and XSS hardening.
4. Reliability: idempotent webhooks, atomic stock reservation, automatic expiry of abandoned checkouts, auto-refund of late payments.

### Research / evaluation angle (what makes it MS-level)
- Compare Stripe vs Razorpay: latency, failure handling, webhook delay, developer effort.
- Fault-injection tests: duplicate webhooks, webhook before client confirm, network drop mid-payment, concurrent buyers of the last item. Report oversell rate and double-charge rate (target: 0).
- Security evaluation: OWASP ASVS checklist, refresh-token replay test, brute-force lockout test, role-escalation attempts.
- Load test with k6 or autocannon on checkout, with p95 latency graphs.

## 2. Folder structure
```
shopnest/
├── server/src/
│   ├── config/        env.js, db.js, roles.js
│   ├── models/        User, RefreshToken, Product, Order
│   ├── middleware/    auth (authenticate/authorize), validate (zod), error
│   ├── validators/    schemas.js (every request body/query)
│   ├── controllers/   auth, product, order, payment (+webhooks), admin
│   ├── services/      token, stripe, razorpay, order (stock + settlement)
│   ├── routes/        auth, product, order, payment, admin, webhook
│   ├── jobs/          expirePending.js
│   ├── scripts/       seed.js
│   ├── app.js         security middleware + routing
│   └── server.js
└── client/src/
    ├── api/           client.js (axios + single-flight token refresh)
    ├── context/       AuthContext, CartContext
    ├── components/    Navbar, ProtectedRoute, ProductCard, OrderList
    ├── pages/         Home, ProductDetail, Cart, Checkout, OrderSuccess, Orders, Login, Register
    │   ├── admin/     AdminDashboard (overview, users, orders, refunds)
    │   ├── retailer/  RetailerDashboard (products CRUD, fulfilment)
    │   └── delivery/  DeliveryDashboard
    └── utils/         format.js
```

## 3. Run it
Prerequisites: Node 18+, MongoDB running locally (or an Atlas URI).
```bash
# API
cd server && cp .env.example .env     # fill in secrets and gateway test keys
npm install
npm run seed                  # creates admin, retailer, customer, delivery + sample products
npm run dev                           # http://localhost:5000

# Web
cd client && cp .env.example .env
npm install
npm run dev                           # http://localhost:5173
```
Seeded logins: `admin@shopnest.dev / Admin@12345`, `retailer@shopnest.dev / Retailer@123`,
`customer@shopnest.dev / Customer@123`, `delivery@shopnest.dev / Delivery@123`.

### Gateway setup (test mode)
- **Stripe**: put the secret and publishable keys in `.env`. For webhooks run
  `stripe listen --forward-to localhost:5000/api/webhooks/stripe` and copy the printed `whsec_...` value.
  Test card `4242 4242 4242 4242`, any future date, any CVC.
- **Razorpay**: put the test key id and secret in `.env`. Dashboard > Webhooks > add
  `https://<public-url>/api/webhooks/razorpay` (use ngrok locally) with events `payment.captured`, `order.paid`.
  Keep **auto-capture** enabled. Test UPI id `success@razorpay`.
- Webhooks are a safety net: the client also confirms with the server (`/payments/stripe/confirm`,
  `/payments/razorpay/verify`), so checkout works locally even without webhooks.

## 4. Security design
| Concern | Implementation |
|---|---|
| Access token | JWT HS256, 15 min, held in JS memory only (never localStorage) |
| Refresh token | 48 random bytes, stored as SHA-256 hash, httpOnly + Secure + SameSite cookie scoped to `/api/auth` |
| Rotation and theft | Every refresh issues a new token; replay of a used token revokes the whole session family (10 s grace for duplicate tabs) |
| Authorization | `authenticate` re-reads the user from the DB each request, so role changes and deactivation apply instantly; `authorize(...roles)` per route |
| Privilege escalation | Only `customer` / `retailer` can self-register; admin and delivery are assigned by admins; retailers need approval |
| Passwords | bcrypt cost 12, strength rules, 5 failures = 15 min lock, password change signs out all devices |
| Input | zod schemas strip unknown fields; `express-mongo-sanitize`, `hpp`, `helmet`, body size limit, rate limits |
| Payments | Price, tax and shipping computed server-side from the DB; client totals are never trusted |

## 5. Payment reliability design (why transactions do not fail or double-charge)
1. `POST /orders` reserves stock with atomic `updateOne({stock: {$gte: qty}}, {$inc: {stock: -qty}})` and rolls back if any line fails.
2. The gateway order/intent is created with an idempotency key (`pi_<orderId>`); gateway failure releases stock and cancels the order.
3. `settlePaid()` is the only code that marks orders paid. It uses a compare-and-set (`status: pending_payment -> paid`), so duplicate webhooks, client confirmations and retries are harmless.
4. Razorpay signatures use HMAC-SHA256 with `timingSafeEqual`; Stripe confirmation re-fetches the PaymentIntent and checks amount and order id.
5. Abandoned checkouts expire after 30 min (job every 5 min) and stock returns to the shelf.
6. If money arrives after expiry or cancellation, the order is refunded automatically (or flagged `refund_required` for the admin).

## 6. Known limitations and future work
- One status per order: a retailer in a multi-retailer order can advance the whole order. Extension: split into per-retailer sub-orders and add payouts (Stripe Connect / Razorpay Route).
- Cart is stored in the browser; a server-side cart would enable cross-device carts.
- Stripe accounts based in India have extra INR/export rules; check your account's supported currencies.
- Ideas for extra marks: email notifications, product reviews, image upload to S3, Redis cache, Jest/Supertest suite, Docker Compose, CI pipeline, recommendation engine.

## 7. Suggested 12-week plan
Weeks 1-2 requirements and design (ERD, API spec) · 3-4 auth and RBAC · 5-6 catalog and cart · 7-8 orders and payments · 9 dashboards · 10 testing and fault injection · 11 security and load evaluation · 12 report and viva demo.
