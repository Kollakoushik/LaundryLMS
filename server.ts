import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { generateJwtToken, comparePassword } from './src/lib/jwt.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { db } from './src/db/index.ts';
import { users, orders } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import {
  seedDatabaseIfEmpty,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getServices,
  createService,
  updateService,
  getClothTypes,
  createClothType,
  updateClothType,
  getPricingMatrix,
  setPricingRule,
  createOrder,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  updateOrderDeliveryDate,
  updateOrderPayment,
  getInvoices,
  getDashboardStats,
} from './src/db/queries.ts';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize and seed database if empty
  await seedDatabaseIfEmpty();

  // ----------------------------------------------------------------
  // HEALTH CHECK
  // ----------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ----------------------------------------------------------------
  // AUTHENTICATION ROUTES (JWT & Firebase Auth)
  // ----------------------------------------------------------------

  // Standard Admin Login (Email & Password)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUsers.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'AUTH_FAILED',
        });
      }

      const user = existingUsers[0];
      if (!user.passwordHash) {
        return res.status(401).json({
          success: false,
          error: 'Account configured for OAuth / Google Sign-In. Please sign in with Google.',
          code: 'OAUTH_ACCOUNT',
        });
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'AUTH_FAILED',
        });
      }

      const token = generateJwtToken({
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      res.json({
        success: true,
        token,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed due to an unexpected server error.',
        code: 'SERVER_AUTH_ERROR',
      });
    }
  });

  // Firebase OAuth Google Sign-In verification & token exchange
  app.post('/api/auth/firebase-login', async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'Firebase ID Token is required',
          code: 'MISSING_FIREBASE_TOKEN',
        });
      }

      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email || `${uid}@laundry.local`;
      const name = decodedToken.name || 'Laundry Admin';

      // Upsert user in database
      const [dbUser] = await db
        .insert(users)
        .values({
          uid,
          email,
          name,
          role: 'admin',
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            name,
          },
        })
        .returning();

      const token = generateJwtToken({
        uid: dbUser.uid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      });

      res.json({
        success: true,
        token,
        user: {
          uid: dbUser.uid,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        },
      });
    } catch (error: any) {
      console.error('Firebase token verification error:', error);
      res.status(401).json({
        success: false,
        error: 'Failed to verify Firebase authentication credentials.',
        code: 'FIREBASE_AUTH_FAILED',
      });
    }
  });

  // Current authenticated user profile
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  });

  // ----------------------------------------------------------------
  // DASHBOARD & ANALYTICS
  // ----------------------------------------------------------------
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats = await getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch dashboard statistics',
        code: 'DASHBOARD_STATS_ERROR',
      });
    }
  });

  // ----------------------------------------------------------------
  // CUSTOMER MANAGEMENT
  // ----------------------------------------------------------------
  app.get('/api/customers', requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const customerList = await getCustomers(search);
      res.json({ success: true, data: customerList });
    } catch (error: any) {
      console.error('Fetch customers error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch customers',
        code: 'CUSTOMER_FETCH_ERROR',
      });
    }
  });

  app.get('/api/customers/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid customer ID' });
      }

      const customer = await getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      // Also fetch customer order history
      const customerOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.customerId, id))
        .orderBy(desc(orders.createdAt));

      res.json({
        success: true,
        data: {
          customer,
          orderHistory: customerOrders,
        },
      });
    } catch (error: any) {
      console.error('Fetch customer detail error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch customer details',
        code: 'CUSTOMER_DETAIL_ERROR',
      });
    }
  });

  app.post('/api/customers', requireAuth, async (req, res) => {
    try {
      const { name, phone, address, notes } = req.body;
      if (!name || !phone || !address) {
        return res.status(400).json({
          success: false,
          error: 'Name, Phone Number, and Address are required',
          code: 'VALIDATION_ERROR',
        });
      }

      const customer = await createCustomer({ name, phone, address, notes });
      res.status(201).json({ success: true, data: customer });
    } catch (error: any) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create customer',
        code: 'CUSTOMER_CREATE_ERROR',
      });
    }
  });

  app.put('/api/customers/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid customer ID' });
      }

      const { name, phone, address, notes } = req.body;
      const updated = await updateCustomer(id, { name, phone, address, notes });
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update customer',
        code: 'CUSTOMER_UPDATE_ERROR',
      });
    }
  });

  // ----------------------------------------------------------------
  // SERVICES & CLOTH TYPES & PRICING
  // ----------------------------------------------------------------
  app.get('/api/services', requireAuth, async (req, res) => {
    try {
      const serviceList = await getServices();
      res.json({ success: true, data: serviceList });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/services', requireAuth, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Service name is required' });
      }
      const created = await createService({ name, description });
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put('/api/services/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateService(id, req.body);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/cloth-types', requireAuth, async (req, res) => {
    try {
      const list = await getClothTypes();
      res.json({ success: true, data: list });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/cloth-types', requireAuth, async (req, res) => {
    try {
      const { name, category, defaultPrice } = req.body;
      if (!name || !defaultPrice) {
        return res.status(400).json({ success: false, error: 'Name and default price are required' });
      }
      const created = await createClothType({ name, category, defaultPrice });
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put('/api/cloth-types/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateClothType(id, req.body);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/pricing', requireAuth, async (req, res) => {
    try {
      const matrix = await getPricingMatrix();
      res.json({ success: true, data: matrix });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/pricing', requireAuth, async (req, res) => {
    try {
      const { clothTypeId, serviceId, price } = req.body;
      if (!clothTypeId || !serviceId || price === undefined) {
        return res.status(400).json({ success: false, error: 'clothTypeId, serviceId, and price are required' });
      }
      const updated = await setPricingRule(clothTypeId, serviceId, price.toString());
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------------------------------------------------------
  // ORDERS & CLOTH ITEMS & INVOICES
  // ----------------------------------------------------------------
  app.get('/api/orders', requireAuth, async (req, res) => {
    try {
      const { status, paymentStatus, customerId, search } = req.query;
      const orderList = await getOrders({
        status: status as string,
        paymentStatus: paymentStatus as string,
        customerId: customerId ? parseInt(customerId as string, 10) : undefined,
        search: search as string,
      });
      res.json({ success: true, data: orderList });
    } catch (error: any) {
      console.error('Fetch orders error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/orders/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid order ID' });
      }

      const details = await getOrderDetails(id);
      if (!details) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      res.json({ success: true, data: details });
    } catch (error: any) {
      console.error('Get order detail error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/orders', requireAuth, async (req, res) => {
    try {
      const { customerId, deliveryDate, paymentStatus, paymentMethod, notes, items } = req.body;
      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'A valid customer and at least one cloth item are required.',
          code: 'ORDER_VALIDATION_ERROR',
        });
      }

      const result = await createOrder({
        customerId,
        deliveryDate,
        paymentStatus,
        paymentMethod,
        notes,
        items,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create order and generate invoice',
      });
    }
  });

  // Update order status
  app.patch('/api/orders/:id/status', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const validStatuses = ['Received', 'In Process', 'Ready', 'Delivered', 'Cancelled'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const updated = await updateOrderStatus(id, status);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update order delivery date
  app.patch('/api/orders/:id/delivery-date', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { deliveryDate } = req.body;
      if (!deliveryDate) {
        return res.status(400).json({ success: false, error: 'deliveryDate is required' });
      }

      const updated = await updateOrderDeliveryDate(id, deliveryDate);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update order payment status
  app.patch('/api/orders/:id/payment', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { paymentStatus, paymentMethod } = req.body;
      const validStatuses = ['Pending', 'Paid'];
      if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          error: `paymentStatus must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const updated = await updateOrderPayment(id, paymentStatus, paymentMethod);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------------------------------------------------------
  // INVOICES & BILLING
  // ----------------------------------------------------------------
  app.get('/api/invoices', requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const invoiceList = await getInvoices(search);
      res.json({ success: true, data: invoiceList });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------------------------------------------------------
  // REPORTS
  // ----------------------------------------------------------------
  app.get('/api/reports', requireAuth, async (req, res) => {
    try {
      const stats = await getDashboardStats();
      const allOrders = await db.select().from(orders);

      // Status breakdown
      const statusCounts: Record<string, number> = {
        Received: 0,
        'In Process': 0,
        Ready: 0,
        Delivered: 0,
        Cancelled: 0,
      };

      // Payment method breakdown
      const paymentMethodCounts: Record<string, { count: number; amount: number }> = {
        Cash: { count: 0, amount: 0 },
        UPI: { count: 0, amount: 0 },
        Card: { count: 0, amount: 0 },
      };

      for (const o of allOrders) {
        if (statusCounts[o.status] !== undefined) {
          statusCounts[o.status]++;
        }
        const method = o.paymentMethod || 'Cash';
        if (!paymentMethodCounts[method]) {
          paymentMethodCounts[method] = { count: 0, amount: 0 };
        }
        paymentMethodCounts[method].count++;
        paymentMethodCounts[method].amount += parseFloat(o.totalAmount) || 0;
      }

      res.json({
        success: true,
        data: {
          summary: stats,
          statusBreakdown: statusCounts,
          paymentMethodBreakdown: paymentMethodCounts,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ----------------------------------------------------------------
  // GLOBAL ERROR HANDLING MIDDLEWARE
  // ----------------------------------------------------------------
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    });
  });

  // ----------------------------------------------------------------
  // VITE DEVELOPMENT MIDDLEWARE / PRODUCTION STATIC SERVING
  // ----------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Laundry Management System backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
});
