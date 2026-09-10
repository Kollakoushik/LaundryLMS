import { db } from './index.ts';
import {
  users,
  customers,
  services,
  clothTypes,
  pricingRules,
  orders,
  orderItems,
  invoices,
} from './schema.ts';
import { eq, desc, sql, ilike, or, and } from 'drizzle-orm';
import { hashPassword } from '../lib/jwt.ts';

// ----------------------------------------------------
// SEED INITIAL DATA
// ----------------------------------------------------
export async function seedDatabaseIfEmpty() {
  try {
    // Check if default admin exists
    const existingAdmin = await db.select().from(users).limit(1);
    if (existingAdmin.length === 0) {
      const passwordHash = await hashPassword('admin123');
      await db.insert(users).values({
        uid: 'admin-default-uid',
        email: 'admin@laundry.com',
        name: 'Master Admin',
        role: 'admin',
        passwordHash,
      });
      console.log('Seeded default admin account (admin@laundry.com / admin123)');
    }

    // Check if services exist
    const existingServices = await db.select().from(services).limit(1);
    if (existingServices.length === 0) {
      const seededServices = await db.insert(services).values([
        { name: 'Washing', description: 'Standard machine wash with deep conditioning' },
        { name: 'Dry Cleaning', description: 'Professional chemical solvent clean for delicate fabrics' },
        { name: 'Ironing', description: 'Steam press and crease setting' },
        { name: 'Wash & Iron', description: 'Full combo wash, soft spin, and crisp steam press' },
      ]).returning();

      // Seed cloth types
      const seededClothTypes = await db.insert(clothTypes).values([
        { name: 'Shirt', category: 'Apparel', defaultPrice: '60.00' },
        { name: 'T-Shirt', category: 'Apparel', defaultPrice: '45.00' },
        { name: 'Trousers / Jeans', category: 'Apparel', defaultPrice: '70.00' },
        { name: 'Saree', category: 'Ethnic', defaultPrice: '150.00' },
        { name: 'Kurta / Pyjama', category: 'Ethnic', defaultPrice: '90.00' },
        { name: 'Suit (2-Piece)', category: 'Formal', defaultPrice: '280.00' },
        { name: 'Bed Sheet (Double)', category: 'Home Linen', defaultPrice: '120.00' },
        { name: 'Blanket / Quilt', category: 'Home Linen', defaultPrice: '250.00' },
        { name: 'Curtains (Pair)', category: 'Home Linen', defaultPrice: '180.00' },
      ]).returning();

      // Seed default pricing rules
      const pricingData: Array<{ clothTypeId: number; serviceId: number; price: string }> = [];
      for (const cloth of seededClothTypes) {
        const base = parseFloat(cloth.defaultPrice);
        for (const service of seededServices) {
          let multiplier = 1.0;
          if (service.name === 'Ironing') multiplier = 0.4;
          if (service.name === 'Dry Cleaning') multiplier = 1.6;
          if (service.name === 'Wash & Iron') multiplier = 1.3;
          pricingData.push({
            clothTypeId: cloth.id,
            serviceId: service.id,
            price: (base * multiplier).toFixed(2),
          });
        }
      }
      await db.insert(pricingRules).values(pricingData);

      // Seed sample customers
      const seededCustomers = await db.insert(customers).values([
        {
          name: 'Rajesh Sharma',
          phone: '+91 98765 43210',
          address: '42, Indiranagar 100ft Road, Bengaluru',
          notes: 'Prefers light starch on shirts',
        },
        {
          name: 'Priya Mukherjee',
          phone: '+91 98112 34567',
          address: 'Flat 4B, Green Glen Layout, Bellandur, Bengaluru',
          notes: 'Delicate silk sarees - handle with care',
        },
        {
          name: 'Amitabh Verma',
          phone: '+91 97234 56789',
          address: 'Plot 12, Sector 14, HSR Layout, Bengaluru',
          notes: 'Deliver before 10 AM',
        },
      ]).returning();

      // Seed sample orders
      const now = new Date();
      const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Order 1: Received
      const [order1] = await db.insert(orders).values({
        orderNumber: 'ORD-1001',
        customerId: seededCustomers[0].id,
        orderDate: now,
        deliveryDate: inThreeDays,
        status: 'In Process',
        paymentStatus: 'Pending',
        paymentMethod: 'UPI',
        totalAmount: '240.00',
        notes: 'Express turnaround requested',
      }).returning();

      await db.insert(orderItems).values([
        {
          orderId: order1.id,
          clothTagId: 'TAG-1001-01',
          clothTypeId: seededClothTypes[0].id,
          clothTypeName: 'Shirt',
          serviceId: seededServices[0].id,
          serviceName: 'Washing',
          quantity: 2,
          unitPrice: '60.00',
          subtotal: '120.00',
          specialInstructions: 'Light starch',
          deliveryDate: inThreeDays,
        },
        {
          orderId: order1.id,
          clothTagId: 'TAG-1001-02',
          clothTypeId: seededClothTypes[2].id,
          clothTypeName: 'Trousers / Jeans',
          serviceId: seededServices[0].id,
          serviceName: 'Washing',
          quantity: 1,
          unitPrice: '70.00',
          subtotal: '70.00',
          specialInstructions: 'Cold wash only',
          deliveryDate: inThreeDays,
        },
        {
          orderId: order1.id,
          clothTagId: 'TAG-1001-03',
          clothTypeId: seededClothTypes[1].id,
          clothTypeName: 'T-Shirt',
          serviceId: seededServices[1].id,
          serviceName: 'Dry Cleaning',
          quantity: 1,
          unitPrice: '50.00',
          subtotal: '50.00',
          specialInstructions: 'Color safe',
          deliveryDate: inThreeDays,
        },
      ]);

      await db.insert(invoices).values({
        invoiceNumber: 'INV-1001',
        orderId: order1.id,
        customerId: seededCustomers[0].id,
        totalAmount: '240.00',
        paymentStatus: 'Pending',
        paymentMethod: 'UPI',
        issueDate: now,
        deliveryDate: inThreeDays,
      });

      // Order 2: Completed / Delivered
      const pastOrderDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      const pastDeliveryDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const [order2] = await db.insert(orders).values({
        orderNumber: 'ORD-1002',
        customerId: seededCustomers[1].id,
        orderDate: pastOrderDate,
        deliveryDate: pastDeliveryDate,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'Cash',
        totalAmount: '450.00',
        notes: 'Delivered on time',
      }).returning();

      await db.insert(orderItems).values([
        {
          orderId: order2.id,
          clothTagId: 'TAG-1002-01',
          clothTypeId: seededClothTypes[3].id,
          clothTypeName: 'Saree',
          serviceId: seededServices[1].id,
          serviceName: 'Dry Cleaning',
          quantity: 2,
          unitPrice: '150.00',
          subtotal: '300.00',
          specialInstructions: 'Pure Zari work',
          deliveryDate: pastDeliveryDate,
        },
        {
          orderId: order2.id,
          clothTagId: 'TAG-1002-02',
          clothTypeId: seededClothTypes[4].id,
          clothTypeName: 'Kurta / Pyjama',
          serviceId: seededServices[3].id,
          serviceName: 'Wash & Iron',
          quantity: 1,
          unitPrice: '150.00',
          subtotal: '150.00',
          specialInstructions: 'Crease sleeves',
          deliveryDate: pastDeliveryDate,
        },
      ]);

      await db.insert(invoices).values({
        invoiceNumber: 'INV-1002',
        orderId: order2.id,
        customerId: seededCustomers[1].id,
        totalAmount: '450.00',
        paymentStatus: 'Paid',
        paymentMethod: 'Cash',
        issueDate: pastOrderDate,
        deliveryDate: pastDeliveryDate,
      });

      console.log('Seeded initial services, cloth types, pricing, customers, and orders.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    // Non-fatal, do not crash app
  }
}

// ----------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------
export async function getCustomers(search?: string) {
  try {
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      return await db
        .select()
        .from(customers)
        .where(
          or(
            ilike(customers.name, q),
            ilike(customers.phone, q),
            ilike(customers.address, q)
          )
        )
        .orderBy(desc(customers.createdAt));
    }
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  } catch (error) {
    console.error('getCustomers query error:', error);
    throw new Error('Failed to retrieve customers. Please try again.', { cause: error });
  }
}

export async function getCustomerById(id: number) {
  try {
    const res = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('getCustomerById query error:', error);
    throw new Error('Failed to retrieve customer details.', { cause: error });
  }
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}) {
  try {
    const [inserted] = await db
      .insert(customers)
      .values({
        name: data.name,
        phone: data.phone,
        address: data.address,
        notes: data.notes || '',
      })
      .returning();
    return inserted;
  } catch (error) {
    console.error('createCustomer query error:', error);
    throw new Error('Failed to create customer. Please check provided data.', { cause: error });
  }
}

export async function updateCustomer(
  id: number,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }
) {
  try {
    const [updated] = await db
      .update(customers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  } catch (error) {
    console.error('updateCustomer query error:', error);
    throw new Error('Failed to update customer.', { cause: error });
  }
}

// ----------------------------------------------------
// SERVICES & CLOTH TYPES & PRICING
// ----------------------------------------------------
export async function getServices() {
  try {
    return await db.select().from(services).orderBy(services.id);
  } catch (error) {
    console.error('getServices query error:', error);
    throw new Error('Failed to retrieve services.', { cause: error });
  }
}

export async function createService(data: { name: string; description?: string }) {
  try {
    const [inserted] = await db
      .insert(services)
      .values({
        name: data.name,
        description: data.description || '',
        isActive: true,
      })
      .returning();
    return inserted;
  } catch (error) {
    console.error('createService query error:', error);
    throw new Error('Failed to create service.', { cause: error });
  }
}

export async function updateService(
  id: number,
  data: { name?: string; description?: string; isActive?: boolean }
) {
  try {
    const [updated] = await db
      .update(services)
      .set(data)
      .where(eq(services.id, id))
      .returning();
    return updated;
  } catch (error) {
    console.error('updateService query error:', error);
    throw new Error('Failed to update service.', { cause: error });
  }
}

export async function getClothTypes() {
  try {
    return await db.select().from(clothTypes).orderBy(clothTypes.id);
  } catch (error) {
    console.error('getClothTypes query error:', error);
    throw new Error('Failed to retrieve cloth types.', { cause: error });
  }
}

export async function createClothType(data: {
  name: string;
  category?: string;
  defaultPrice: string;
}) {
  try {
    const [inserted] = await db
      .insert(clothTypes)
      .values({
        name: data.name,
        category: data.category || 'Apparel',
        defaultPrice: data.defaultPrice,
        isActive: true,
      })
      .returning();
    return inserted;
  } catch (error) {
    console.error('createClothType query error:', error);
    throw new Error('Failed to create cloth type.', { cause: error });
  }
}

export async function updateClothType(
  id: number,
  data: {
    name?: string;
    category?: string;
    defaultPrice?: string;
    isActive?: boolean;
  }
) {
  try {
    const [updated] = await db
      .update(clothTypes)
      .set(data)
      .where(eq(clothTypes.id, id))
      .returning();
    return updated;
  } catch (error) {
    console.error('updateClothType query error:', error);
    throw new Error('Failed to update cloth type.', { cause: error });
  }
}

export async function getPricingMatrix() {
  try {
    const allServices = await db.select().from(services).where(eq(services.isActive, true));
    const allClothTypes = await db.select().from(clothTypes).where(eq(clothTypes.isActive, true));
    const rules = await db.select().from(pricingRules);

    return {
      services: allServices,
      clothTypes: allClothTypes,
      rules,
    };
  } catch (error) {
    console.error('getPricingMatrix query error:', error);
    throw new Error('Failed to retrieve pricing matrix.', { cause: error });
  }
}

export async function setPricingRule(clothTypeId: number, serviceId: number, price: string) {
  try {
    const existing = await db
      .select()
      .from(pricingRules)
      .where(
        and(
          eq(pricingRules.clothTypeId, clothTypeId),
          eq(pricingRules.serviceId, serviceId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(pricingRules)
        .set({ price, updatedAt: new Date() })
        .where(eq(pricingRules.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(pricingRules)
        .values({
          clothTypeId,
          serviceId,
          price,
        })
        .returning();
      return inserted;
    }
  } catch (error) {
    console.error('setPricingRule query error:', error);
    throw new Error('Failed to update pricing rule.', { cause: error });
  }
}

// ----------------------------------------------------
// ORDERS & ITEMS & INVOICES
// ----------------------------------------------------
export interface CreateOrderItemInput {
  clothTypeId: number;
  clothTypeName: string;
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: string;
  specialInstructions?: string;
  deliveryDate?: string;
}

export interface CreateOrderInput {
  customerId: number;
  deliveryDate?: string; // If not provided, defaults to 3 days from now
  paymentStatus?: 'Pending' | 'Paid';
  paymentMethod?: 'Cash' | 'UPI' | 'Card';
  notes?: string;
  items: CreateOrderItemInput[];
}

export async function createOrder(input: CreateOrderInput) {
  try {
    const now = new Date();
    // Default delivery date is 3 days from order date
    const deliveryDateObj = input.deliveryDate
      ? new Date(input.deliveryDate)
      : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Calculate total amount
    let calculatedTotal = 0;
    for (const item of input.items) {
      const qty = Math.max(1, item.quantity || 1);
      const price = parseFloat(item.unitPrice) || 0;
      calculatedTotal += qty * price;
    }
    const totalAmountStr = calculatedTotal.toFixed(2);

    // Generate unique order number (e.g., ORD-2601)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${randomSuffix.toString().slice(0, 2)}`;

    // 1. Insert order
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId: input.customerId,
        orderDate: now,
        deliveryDate: deliveryDateObj,
        status: 'Received',
        paymentStatus: input.paymentStatus || 'Pending',
        paymentMethod: input.paymentMethod || 'Cash',
        totalAmount: totalAmountStr,
        notes: input.notes || '',
      })
      .returning();

    // 2. Insert items with unique clothTagId
    const itemRecords = [];
    let itemIndex = 1;
    for (const item of input.items) {
      const clothTagId = `TAG-${newOrder.id}-${itemIndex.toString().padStart(2, '0')}`;
      const qty = Math.max(1, item.quantity || 1);
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const subtotal = (qty * unitPrice).toFixed(2);
      const itemDelivery = item.deliveryDate ? new Date(item.deliveryDate) : deliveryDateObj;

      const [insertedItem] = await db
        .insert(orderItems)
        .values({
          orderId: newOrder.id,
          clothTagId,
          clothTypeId: item.clothTypeId,
          clothTypeName: item.clothTypeName,
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: qty,
          unitPrice: unitPrice.toFixed(2),
          subtotal,
          specialInstructions: item.specialInstructions || '',
          deliveryDate: itemDelivery,
        })
        .returning();

      itemRecords.push(insertedItem);
      itemIndex++;
    }

    // 3. Automatic invoice generation
    const invoiceNumber = `INV-${orderNumber.replace('ORD-', '')}`;
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        orderId: newOrder.id,
        customerId: input.customerId,
        totalAmount: totalAmountStr,
        paymentStatus: input.paymentStatus || 'Pending',
        paymentMethod: input.paymentMethod || 'Cash',
        issueDate: now,
        deliveryDate: deliveryDateObj,
      })
      .returning();

    return {
      order: newOrder,
      items: itemRecords,
      invoice: newInvoice,
    };
  } catch (error) {
    console.error('createOrder query error:', error);
    throw new Error('Failed to create order and items.', { cause: error });
  }
}

export async function getOrders(filters?: {
  status?: string;
  paymentStatus?: string;
  customerId?: number;
  search?: string;
}) {
  try {
    const conditions = [];

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(eq(orders.status, filters.status));
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
      conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
    }
    if (filters?.customerId) {
      conditions.push(eq(orders.customerId, filters.customerId));
    }

    const orderRows = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    // If search term provided, filter by orderNumber, customer name, or phone
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      return orderRows.filter(
        (r) =>
          r.order.orderNumber.toLowerCase().includes(q) ||
          r.customer.name.toLowerCase().includes(q) ||
          r.customer.phone.toLowerCase().includes(q)
      );
    }

    return orderRows;
  } catch (error) {
    console.error('getOrders query error:', error);
    throw new Error('Failed to retrieve orders.', { cause: error });
  }
}

export async function getOrderDetails(orderId: number) {
  try {
    const orderRes = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderRes.length === 0) return null;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(orderItems.id);

    const invoiceList = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, orderId))
      .limit(1);

    return {
      order: orderRes[0].order,
      customer: orderRes[0].customer,
      items,
      invoice: invoiceList[0] || null,
    };
  } catch (error) {
    console.error('getOrderDetails query error:', error);
    throw new Error('Failed to retrieve order details.', { cause: error });
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    const [updated] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updated;
  } catch (error) {
    console.error('updateOrderStatus query error:', error);
    throw new Error('Failed to update order status.', { cause: error });
  }
}

export async function updateOrderDeliveryDate(orderId: number, deliveryDate: string) {
  try {
    const deliveryDateObj = new Date(deliveryDate);
    const [updated] = await db
      .update(orders)
      .set({
        deliveryDate: deliveryDateObj,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Update invoices and items delivery date
    await db
      .update(invoices)
      .set({ deliveryDate: deliveryDateObj })
      .where(eq(invoices.orderId, orderId));

    await db
      .update(orderItems)
      .set({ deliveryDate: deliveryDateObj })
      .where(eq(orderItems.orderId, orderId));

    return updated;
  } catch (error) {
    console.error('updateOrderDeliveryDate query error:', error);
    throw new Error('Failed to update delivery date.', { cause: error });
  }
}

export async function updateOrderPayment(
  orderId: number,
  paymentStatus: string,
  paymentMethod?: string
) {
  try {
    const updatePayload: Record<string, any> = {
      paymentStatus,
      updatedAt: new Date(),
    };
    if (paymentMethod) {
      updatePayload.paymentMethod = paymentMethod;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updatePayload)
      .where(eq(orders.id, orderId))
      .returning();

    // Also update invoice
    const invoicePayload: Record<string, any> = { paymentStatus };
    if (paymentMethod) {
      invoicePayload.paymentMethod = paymentMethod;
    }
    await db
      .update(invoices)
      .set(invoicePayload)
      .where(eq(invoices.orderId, orderId));

    return updatedOrder;
  } catch (error) {
    console.error('updateOrderPayment query error:', error);
    throw new Error('Failed to update payment status.', { cause: error });
  }
}

export async function getInvoices(search?: string) {
  try {
    const res = await db
      .select({
        invoice: invoices,
        order: orders,
        customer: customers,
      })
      .from(invoices)
      .innerJoin(orders, eq(invoices.orderId, orders.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.createdAt));

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      return res.filter(
        (r) =>
          r.invoice.invoiceNumber.toLowerCase().includes(q) ||
          r.order.orderNumber.toLowerCase().includes(q) ||
          r.customer.name.toLowerCase().includes(q) ||
          r.customer.phone.toLowerCase().includes(q)
      );
    }
    return res;
  } catch (error) {
    console.error('getInvoices query error:', error);
    throw new Error('Failed to retrieve invoices.', { cause: error });
  }
}

export async function getDashboardStats() {
  try {
    const allOrders = await db.select().from(orders);

    const totalOrders = allOrders.length;
    let completedOrders = 0;
    let pendingOrders = 0;
    let pendingDeliveries = 0;
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingPayments = 0;

    const now = new Date();

    for (const ord of allOrders) {
      const amt = parseFloat(ord.totalAmount) || 0;
      totalRevenue += amt;

      if (ord.status === 'Delivered') {
        completedOrders++;
      } else if (ord.status !== 'Cancelled') {
        pendingOrders++;
      }

      if (ord.status !== 'Delivered' && ord.status !== 'Cancelled') {
        // Pending delivery
        pendingDeliveries++;
      }

      if (ord.paymentStatus === 'Paid') {
        paidRevenue += amt;
      } else {
        pendingPayments += amt;
      }
    }

    // Recent 5 orders
    const recent = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.createdAt))
      .limit(6);

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      pendingDeliveries,
      totalRevenue: totalRevenue.toFixed(2),
      paidRevenue: paidRevenue.toFixed(2),
      pendingPayments: pendingPayments.toFixed(2),
      recentOrders: recent,
    };
  } catch (error) {
    console.error('getDashboardStats query error:', error);
    throw new Error('Failed to generate dashboard statistics.', { cause: error });
  }
}
