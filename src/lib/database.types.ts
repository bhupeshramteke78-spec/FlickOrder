export type Role = "CUSTOMER" | "OWNER" | "MANAGER" | "KITCHEN" | "WAITER" | "SUPER_ADMIN";
export type MemberRole = "OWNER" | "MANAGER" | "KITCHEN" | "WAITER";
export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatus = "UNPAID" | "VERIFICATION_PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "UPI" | "CASH" | "CARD_MACHINE";
export type FoodType = "VEG" | "NON_VEG" | "EGG";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING";
export type ServiceRequestType = "WATER" | "TISSUE" | "SPOON" | "FORK" | "BILL" | "WAITER";
export type ServiceRequestStatus = "OPEN" | "ACKNOWLEDGED" | "COMPLETED" | "CANCELLED";
export type SubscriptionUpgradeStatus =
  | "PENDING_PAYMENT"
  | "VERIFICATION_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamped<T> = T & {
  id: string;
  created_at: string;
  updated_at: string;
};

type DbTable<TRow, TInsert, TUpdate> = {
  Row: TRow;
  Insert: TInsert;
  Update: TUpdate;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: DbTable<
        Timestamped<{ full_name: string; phone: string | null; role: Role }>,
        { id: string; full_name: string; phone?: string | null; role: Role },
        Partial<{ full_name: string; phone: string | null; role: Role }>
      >;
      restaurants: DbTable<
        Timestamped<{
          owner_id: string;
          name: string;
          slug: string;
          type: string;
          cuisine: string[];
          email: string;
          phone: string;
          city: string;
          state: string;
          address: string;
          logo_url: string | null;
          cover_url: string | null;
          rating: number | null;
          is_open: boolean;
        }>,
        {
          owner_id: string;
          name: string;
          slug: string;
          type: string;
          cuisine: string[];
          email: string;
          phone: string;
          city: string;
          state: string;
          address: string;
        },
        Partial<{
          owner_id: string;
          name: string;
          slug: string;
          type: string;
          cuisine: string[];
          email: string;
          phone: string;
          city: string;
          state: string;
          address: string;
          logo_url: string | null;
          cover_url: string | null;
          rating: number | null;
          is_open: boolean;
        }>
      >;
      restaurant_members: DbTable<
        Timestamped<{ restaurant_id: string; profile_id: string; role: MemberRole; invited_by: string | null }>,
        { restaurant_id: string; profile_id: string; role: MemberRole; invited_by?: string | null },
        Partial<{ role: MemberRole; invited_by: string | null }>
      >;
      subscriptions: DbTable<
        Timestamped<{
          restaurant_id: string;
          plan: "trial" | "basic" | "growth" | "pro";
          status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
          trial_ends_at: string | null;
          current_period_ends_at: string | null;
        }>,
        {
          restaurant_id: string;
          plan: "trial" | "basic" | "growth" | "pro";
          status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
        },
        Partial<{
          restaurant_id: string;
          plan: "trial" | "basic" | "growth" | "pro";
          status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
          trial_ends_at: string | null;
          current_period_ends_at: string | null;
        }>
      >;
      subscription_upgrade_requests: DbTable<
        Timestamped<{
          restaurant_id: string;
          requested_by: string | null;
          plan: "basic" | "growth" | "pro";
          amount: number;
          status: SubscriptionUpgradeStatus;
          payment_method: "UPI" | "RAZORPAY";
          gateway: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          paid_at: string | null;
          transaction_note: string;
          verified_by: string | null;
          verified_at: string | null;
        }>,
        {
          restaurant_id: string;
          requested_by?: string | null;
          plan: "basic" | "growth" | "pro";
          amount: number;
          status?: SubscriptionUpgradeStatus;
          payment_method?: "UPI" | "RAZORPAY";
          gateway?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          paid_at?: string | null;
          transaction_note: string;
          verified_by?: string | null;
          verified_at?: string | null;
        },
        Partial<{
          restaurant_id: string;
          requested_by: string | null;
          plan: "basic" | "growth" | "pro";
          amount: number;
          status: SubscriptionUpgradeStatus;
          payment_method: "UPI" | "RAZORPAY";
          gateway: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          paid_at: string | null;
          transaction_note: string;
          verified_by: string | null;
          verified_at: string | null;
        }>
      >;
      restaurant_settings: DbTable<
        Timestamped<{
          restaurant_id: string;
          brand_color: string;
          upi_id: string;
          upi_display_name: string;
          tax_rate: number;
          qr_ordering_enabled: boolean;
          menu_preferences: Json;
          opening_hours: Json;
        }>,
        {
          restaurant_id: string;
          brand_color?: string;
          upi_id: string;
          upi_display_name: string;
          tax_rate?: number;
          qr_ordering_enabled?: boolean;
          menu_preferences?: Json;
          opening_hours?: Json;
        },
        Partial<{
          restaurant_id: string;
          brand_color: string;
          upi_id: string;
          upi_display_name: string;
          tax_rate: number;
          qr_ordering_enabled: boolean;
          menu_preferences: Json;
          opening_hours: Json;
        }>
      >;
      categories: DbTable<
        Timestamped<{ restaurant_id: string; name: string; sort_order: number; is_active: boolean }>,
        { restaurant_id: string; name: string; sort_order?: number; is_active?: boolean },
        Partial<{ restaurant_id: string; name: string; sort_order: number; is_active: boolean }>
      >;
      menu_items: DbTable<
        Timestamped<{
          restaurant_id: string;
          category_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          price: number;
          offer_price: number | null;
          preparation_time_minutes: number;
          food_type: FoodType;
          is_available: boolean;
          is_sold_out: boolean;
          is_popular: boolean;
        }>,
        {
          restaurant_id: string;
          category_id: string;
          name: string;
          price: number;
          preparation_time_minutes: number;
          food_type: FoodType;
          description?: string | null;
          image_url?: string | null;
          offer_price?: number | null;
          is_available?: boolean;
          is_sold_out?: boolean;
          is_popular?: boolean;
        },
        Partial<{
          restaurant_id: string;
          category_id: string;
          name: string;
          price: number;
          preparation_time_minutes: number;
          food_type: FoodType;
          description: string | null;
          image_url: string | null;
          offer_price: number | null;
          is_available: boolean;
          is_sold_out: boolean;
          is_popular: boolean;
        }>
      >;
      tables: DbTable<
        Timestamped<{ restaurant_id: string; table_number: string; seats: number; status: TableStatus; qr_token: string }>,
        { restaurant_id: string; table_number: string; seats?: number; status?: TableStatus; qr_token?: string },
        Partial<{ restaurant_id: string; table_number: string; seats: number; status: TableStatus; qr_token: string }>
      >;
      orders: DbTable<
        Timestamped<{
          restaurant_id: string;
          table_id: string;
          order_number: string;
          status: OrderStatus;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          payment_status: PaymentStatus;
          customer_id: string | null;
          customer_name: string | null;
          guest_count: number;
          kitchen_notes: string | null;
        }>,
        {
          restaurant_id: string;
          table_id: string;
          order_number: string;
          status?: OrderStatus;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          payment_status?: PaymentStatus;
          customer_id?: string | null;
          customer_name?: string | null;
          guest_count?: number;
          kitchen_notes?: string | null;
        },
        Partial<{
          restaurant_id: string;
          table_id: string;
          order_number: string;
          status: OrderStatus;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          payment_status: PaymentStatus;
          customer_id: string | null;
          customer_name: string | null;
          guest_count: number;
          kitchen_notes: string | null;
        }>
      >;
      order_items: DbTable<
        Timestamped<{
          order_id: string;
          menu_item_id: string;
          name_snapshot: string;
          unit_price: number;
          quantity: number;
          notes: string | null;
          options: string[];
          total: number;
        }>,
        {
          order_id: string;
          menu_item_id: string;
          name_snapshot: string;
          unit_price: number;
          quantity: number;
          notes?: string | null;
          options?: string[];
          total: number;
        },
        Partial<{
          order_id: string;
          menu_item_id: string;
          name_snapshot: string;
          unit_price: number;
          quantity: number;
          notes: string | null;
          options: string[];
          total: number;
        }>
      >;
      payments: DbTable<
        Timestamped<{
          restaurant_id: string;
          order_id: string;
          method: PaymentMethod;
          status: PaymentStatus;
          amount: number;
          transaction_note: string;
          confirmed_by: string | null;
        }>,
        {
          restaurant_id: string;
          order_id: string;
          method: PaymentMethod;
          status?: PaymentStatus;
          amount: number;
          transaction_note: string;
          confirmed_by?: string | null;
        },
        Partial<{
          restaurant_id: string;
          order_id: string;
          method: PaymentMethod;
          status: PaymentStatus;
          amount: number;
          transaction_note: string;
          confirmed_by: string | null;
        }>
      >;
      service_requests: DbTable<
        Timestamped<{
          restaurant_id: string;
          table_id: string;
          order_id: string | null;
          type: ServiceRequestType;
          status: ServiceRequestStatus;
        }>,
        {
          restaurant_id: string;
          table_id: string;
          order_id?: string | null;
          type: ServiceRequestType;
          status?: ServiceRequestStatus;
        },
        Partial<{
          restaurant_id: string;
          table_id: string;
          order_id: string | null;
          type: ServiceRequestType;
          status: ServiceRequestStatus;
        }>
      >;
      reviews: DbTable<
        Timestamped<{ restaurant_id: string; customer_id: string; rating: number; comment: string | null }>,
        { restaurant_id: string; customer_id: string; rating: number; comment?: string | null },
        Partial<{ rating: number; comment: string | null }>
      >;
      favorites: DbTable<
        Timestamped<{ restaurant_id: string; customer_id: string }>,
        { restaurant_id: string; customer_id: string },
        Partial<{ restaurant_id: string; customer_id: string }>
      >;
      notifications: DbTable<
        Timestamped<{ restaurant_id: string; profile_id: string | null; type: string; payload: Json; read_at: string | null }>,
        { restaurant_id: string; profile_id?: string | null; type: string; payload?: Json; read_at?: string | null },
        Partial<{ read_at: string | null; payload: Json }>
      >;
      audit_logs: DbTable<
        Timestamped<{ actor_id: string | null; restaurant_id: string | null; action: string; entity: string; entity_id: string | null; metadata: Json }>,
        { actor_id?: string | null; restaurant_id?: string | null; action: string; entity: string; entity_id?: string | null; metadata?: Json },
        Partial<{ metadata: Json }>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      create_qr_order_transaction: {
        Args: {
          p_restaurant_slug: string;
          p_table_number: string;
          p_customer_name: string;
          p_guest_count: number;
          p_kitchen_notes: string | null;
          p_items: Json;
        };
        Returns: Array<{
          order_id: string;
          order_number: string;
        }>;
      };
    };
  };
};
