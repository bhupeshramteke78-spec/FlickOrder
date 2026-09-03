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
export type RestaurantVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED";
export type SubscriptionUpgradeStatus =
  | "PENDING_PAYMENT"
  | "VERIFICATION_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DECLINED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

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
          verification_status: RestaurantVerificationStatus;
          fssai_number: string | null;
          google_maps_url: string | null;
          latitude: number | null;
          longitude: number | null;
          location_source: "OWNER_MANUAL" | "GOOGLE_MAPS_LINK" | "GEOCODED_ADDRESS" | "PIN_PICKER" | null;
          verification_note: string | null;
          verified_at: string | null;
          verified_by: string | null;
          deletion_requested_at: string | null;
          deletion_requested_by: string | null;
          deletion_reason: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
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
          verification_status?: RestaurantVerificationStatus;
          fssai_number?: string | null;
          google_maps_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_source?: "OWNER_MANUAL" | "GOOGLE_MAPS_LINK" | "GEOCODED_ADDRESS" | "PIN_PICKER" | null;
          verification_note?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          deletion_requested_at?: string | null;
          deletion_requested_by?: string | null;
          deletion_reason?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
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
          verification_status: RestaurantVerificationStatus;
          fssai_number: string | null;
          google_maps_url: string | null;
          latitude: number | null;
          longitude: number | null;
          location_source: "OWNER_MANUAL" | "GOOGLE_MAPS_LINK" | "GEOCODED_ADDRESS" | "PIN_PICKER" | null;
          verification_note: string | null;
          verified_at: string | null;
          verified_by: string | null;
          deletion_requested_at: string | null;
          deletion_requested_by: string | null;
          deletion_reason: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
        }>
      >;
      restaurant_verification_documents: DbTable<
        {
          id: string;
          restaurant_id: string;
          document_type: "FSSAI_CERTIFICATE" | "STOREFRONT_PHOTO" | "OWNER_ID" | "GST_CERTIFICATE" | "OTHER";
          file_url: string;
          created_at: string;
        },
        {
          restaurant_id: string;
          document_type: "FSSAI_CERTIFICATE" | "STOREFRONT_PHOTO" | "OWNER_ID" | "GST_CERTIFICATE" | "OTHER";
          file_url: string;
        },
        Partial<{
          restaurant_id: string;
          document_type: "FSSAI_CERTIFICATE" | "STOREFRONT_PHOTO" | "OWNER_ID" | "GST_CERTIFICATE" | "OTHER";
          file_url: string;
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
          billing_interval?: "MONTHLY" | "YEARLY" | string | null;
          trial_ends_at: string | null;
          current_period_ends_at: string | null;
        }>,
        {
          restaurant_id: string;
          plan: "trial" | "basic" | "growth" | "pro";
          status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
          billing_interval?: "MONTHLY" | "YEARLY" | string | null;
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
        },
        Partial<{
          restaurant_id: string;
          plan: "trial" | "basic" | "growth" | "pro";
          status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
          billing_interval?: "MONTHLY" | "YEARLY" | string | null;
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
          billing_interval?: "MONTHLY" | "YEARLY" | string | null;
          payment_method: "UPI" | "RAZORPAY";
          gateway: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          paid_at: string | null;
          payment_submitted_at: string | null;
          rejection_reason: string | null;
          transaction_id: string | null;
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
          billing_interval?: "MONTHLY" | "YEARLY" | string | null;
          payment_method?: "UPI" | "RAZORPAY";
          gateway?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          paid_at?: string | null;
          payment_submitted_at?: string | null;
          rejection_reason?: string | null;
          transaction_id?: string | null;
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
          billing_interval?: "MONTHLY" | "YEARLY" | string | null;
          payment_method: "UPI" | "RAZORPAY";
          gateway: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          paid_at: string | null;
          payment_submitted_at: string | null;
          rejection_reason: string | null;
          transaction_id: string | null;
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
          booking_enabled: boolean;
          booking_slot_minutes: number;
          booking_duration_minutes: number;
          booking_advance_days: number;
          booking_min_notice_minutes: number;
          booking_max_party_size: number;
          kitchen_enabled?: boolean;
          waiter_enabled?: boolean;
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
          booking_enabled?: boolean;
          booking_slot_minutes?: number;
          booking_duration_minutes?: number;
          booking_advance_days?: number;
          booking_min_notice_minutes?: number;
          booking_max_party_size?: number;
          kitchen_enabled?: boolean;
          waiter_enabled?: boolean;
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
          booking_enabled: boolean;
          booking_slot_minutes: number;
          booking_duration_minutes: number;
          booking_advance_days: number;
          booking_min_notice_minutes: number;
          booking_max_party_size: number;
          kitchen_enabled?: boolean;
          waiter_enabled?: boolean;
        }>
      >;
      push_subscriptions: DbTable<
        {
          id: string;
          restaurant_id: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          restaurant_id: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
        },
        Partial<{
          restaurant_id: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
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
      restaurant_bookings: DbTable<
        Timestamped<{
          restaurant_id: string;
          table_id: string | null;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          party_size: number;
          booking_date: string;
          booking_time: string;
          duration_minutes: number;
          special_request: string | null;
          status: BookingStatus;
          confirmation_code: string;
          access_token_hash: string;
          source: "WEB" | "STAFF";
          accepted_by: string | null;
          accepted_at: string | null;
          decline_reason: string | null;
        }>,
        {
          restaurant_id: string;
          customer_name: string;
          customer_phone: string;
          party_size: number;
          booking_date: string;
          booking_time: string;
          confirmation_code: string;
          access_token_hash: string;
          table_id?: string | null;
          customer_id?: string | null;
          duration_minutes?: number;
          special_request?: string | null;
          status?: BookingStatus;
          source?: "WEB" | "STAFF";
          accepted_by?: string | null;
          accepted_at?: string | null;
          decline_reason?: string | null;
        },
        Partial<{
          table_id: string | null;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          party_size: number;
          booking_date: string;
          booking_time: string;
          duration_minutes: number;
          special_request: string | null;
          status: BookingStatus;
          accepted_by: string | null;
          accepted_at: string | null;
          decline_reason: string | null;
        }>
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
      consume_api_rate_limit: {
        Args: {
          p_key: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: Array<{
          allowed: boolean;
          retry_after_seconds: number;
        }>;
      };
      provision_restaurant_owner: {
        Args: {
          p_owner_id: string;
          p_owner_name: string;
          p_phone: string;
          p_restaurant_name: string;
          p_slug: string;
          p_restaurant_type: string;
          p_cuisine: string[];
          p_email: string;
          p_city: string;
          p_state: string;
          p_address: string;
          p_upi_id: string;
          p_upi_display_name: string;
          p_fssai_number: string;
          p_google_maps_url: string | null;
          p_latitude: number | null;
          p_longitude: number | null;
          p_documents: Json;
        };
        Returns: Array<{
          restaurant_id: string;
          restaurant_slug: string;
        }>;
      };
      activate_subscription_payment: {
        Args: {
          p_request_id: string;
          p_payment_id?: string | null;
          p_signature?: string | null;
          p_verified_by?: string | null;
          p_webhook_event_id?: string | null;
        };
        Returns: Array<{
          request_id: string;
          restaurant_id: string;
          plan: string;
          current_period_ends_at: string;
          already_processed: boolean;
        }>;
      };
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
      create_restaurant_booking: {
        Args: {
          p_restaurant_id: string;
          p_customer_id: string | null;
          p_customer_name: string;
          p_customer_phone: string;
          p_party_size: number;
          p_booking_date: string;
          p_booking_time: string;
          p_duration_minutes: number;
          p_special_request: string | null;
          p_access_token_hash: string;
        };
        Returns: Array<{
          booking_id: string;
          confirmation_code: string;
        }>;
      };
      run_subscription_lifecycle_maintenance: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
  };
};
