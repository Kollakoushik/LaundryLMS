export interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ClothType {
  id: number;
  name: string;
  category: string;
  defaultPrice: string;
  isActive: boolean;
  createdAt: string;
}

export interface PricingRule {
  id: number;
  clothTypeId: number;
  serviceId: number;
  price: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  clothTagId: string;
  clothTypeId: number;
  clothTypeName: string;
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  specialInstructions?: string | null;
  deliveryDate: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  orderDate: string;
  deliveryDate: string;
  status: 'Received' | 'In Process' | 'Ready' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid';
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithCustomer {
  order: Order;
  customer: Customer;
}

export interface OrderDetail {
  order: Order;
  customer: Customer;
  items: OrderItem[];
  invoice: Invoice | null;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  customerId: number;
  totalAmount: string;
  paymentStatus: 'Pending' | 'Paid';
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  issueDate: string;
  deliveryDate: string;
  createdAt: string;
}

export interface InvoiceWithDetails {
  invoice: Invoice;
  order: Order;
  customer: Customer;
}

export interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  pendingDeliveries: number;
  totalRevenue: string;
  paidRevenue: string;
  pendingPayments: string;
  recentOrders: OrderWithCustomer[];
}

export interface ReportData {
  summary: DashboardStats;
  statusBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
}
