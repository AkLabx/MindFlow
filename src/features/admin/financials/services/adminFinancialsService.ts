import { supabase } from '@/lib/supabase';
import { DB_RPCS, DB_TABLES } from '@/config/dbTables';
import { invalidateCoursePurchaseCaches } from '@/features/mock-tests/api/mockTestsApi';

export interface PaymentTransaction {
    id: string;
    created_at: string;
    user_id: string | null;
    razorpay_payment_id: string | null;
    razorpay_order_id: string | null;
    order_code?: string | null;
    series_id?: string | null;
    course_type?: string | null;
    target_route?: string | null;
    validity_days?: number | null;
    valid_until?: string | null;
    payment_method?: string | null;
    upi_reference?: string | null;
    student_id_snapshot?: string | null;
    admin_note?: string | null;
    amount: number | null;
    currency: string | null;
    status: string;
    plan_purchased: string | null;
    webhook_payload?: any;
    user_name?: string;
    user_email?: string;
    student_id?: string | null;
}

export interface SubscriptionStats {
    free: number;
    spark: number;
    pro: number;
    other: number;
    total: number;
}

export interface FinancialMetrics {
    totalRevenueInr: number;
    successfulCount: number;
    pendingCount: number;
    failedCount: number;
    plansCount: Record<string, number>;
    subscriptionStats: SubscriptionStats;
}

export interface StudentEnrollmentLookupResult {
    found: boolean;
    profile: {
        id: string;
        student_id: string;
        full_name: string | null;
        email: string | null;
        target_exam: string | null;
        created_at: string;
    } | null;
    entitlements: Array<{
        id: string;
        series_id: string;
        series_name: string | null;
        course_type: string;
        status: string;
        starts_at: string;
        valid_until: string;
    }>;
}

export interface EnrollableCourseSeriesOption {
    id: string;
    name: string;
    price_inr: number;
    validity_days: number;
    is_premium: boolean;
    is_published: boolean;
}

export const resolvePaymentAmountInr = (
    p: Pick<PaymentTransaction, 'amount' | 'payment_method' | 'status'>
): number => {
    const rawAmount = Number(p.amount ?? 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) return 0;
    const method = String(p.payment_method ?? '').toLowerCase();
    const status = String(p.status ?? '').toLowerCase();
    if (method === 'razorpay' || (method === '' && status.includes('captured'))) {
        return rawAmount >= 1000 ? rawAmount / 100 : rawAmount;
    }
    return rawAmount;
};

export const fetchFinancialData = async (): Promise<{
    payments: PaymentTransaction[];
    metrics: FinancialMetrics;
}> => {
    const { data: paymentsData, error: paymentsError } = await supabase
        .from(DB_TABLES.BILLING.PAYMENTS)
        .select('*')
        .order('created_at', { ascending: false });

    if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
    }

    const rawPayments = (paymentsData as PaymentTransaction[]) || [];

    const userIds = Array.from(new Set(rawPayments.map(p => p.user_id).filter(Boolean))) as string[];
    let profilesMap: Record<
        string,
        { full_name?: string; username?: string; student_id?: string | null; email?: string | null }
    > = {};

    if (userIds.length > 0) {
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, username, student_id, email')
            .in('id', userIds);

        if (profilesData) {
            profilesMap = profilesData.reduce((acc, p: any) => {
                acc[p.id] = {
                    full_name: p.full_name,
                    username: p.username,
                    student_id: p.student_id,
                    email: p.email,
                };
                return acc;
            }, {} as Record<string, { full_name?: string; username?: string; student_id?: string | null; email?: string | null }>);
        }
    }

    const payments: PaymentTransaction[] = rawPayments.map(p => {
        const profile = p.user_id ? profilesMap[p.user_id] : undefined;
        return {
            ...p,
            user_name:
                profile?.full_name ||
                profile?.username ||
                (p.user_id ? `User ${p.user_id.slice(0, 8)}` : 'Anonymous / Guest'),
            user_email: profile?.email || p.user_email,
            student_id: p.student_id_snapshot || profile?.student_id || null,
        };
    });

    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('subscription_status');

    const subscriptionStats: SubscriptionStats = {
        free: 0,
        spark: 0,
        pro: 0,
        other: 0,
        total: allProfiles?.length || 0
    };

    allProfiles?.forEach(p => {
        const status = (p.subscription_status || 'free').toLowerCase();
        if (status === 'free') subscriptionStats.free++;
        else if (status === 'spark') subscriptionStats.spark++;
        else if (status === 'pro') subscriptionStats.pro++;
        else subscriptionStats.other++;
    });

    let totalRevenueInr = 0;
    let successfulCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const plansCount: Record<string, number> = {};

    payments.forEach(p => {
        const st = String(p.status || '').toLowerCase();
        const isSuccess = st === 'paid' || st.includes('captured') || st === 'success';
        const isPending = st === 'pending_verification' || st === 'pending';

        if (isSuccess) {
            successfulCount++;
            totalRevenueInr += resolvePaymentAmountInr(p);
        } else if (isPending) {
            pendingCount++;
        } else if (st.includes('fail') || st === 'rejected') {
            failedCount++;
        }

        const plan = p.plan_purchased || 'unknown';
        plansCount[plan] = (plansCount[plan] || 0) + 1;
    });

    return {
        payments,
        metrics: {
            totalRevenueInr,
            successfulCount,
            pendingCount,
            failedCount,
            plansCount,
            subscriptionStats
        }
    };
};

export const fetchEnrollableMockSeries = async (): Promise<EnrollableCourseSeriesOption[]> => {
    const { data, error } = await supabase
        .from(DB_TABLES.MOCK.SERIES)
        .select('id, name, price_inr, validity_days, is_premium, is_published')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? 'Untitled Series'),
        price_inr: Math.max(0, Number(row.price_inr ?? 0)),
        validity_days: Math.max(1, Number(row.validity_days ?? 365)),
        is_premium: Boolean(row.is_premium),
        is_published: Boolean(row.is_published),
    }));
};

export const lookupStudentByStudentId = async (
    studentId: string
): Promise<StudentEnrollmentLookupResult> => {
    const clean = String(studentId ?? '').trim().toUpperCase();
    if (!clean) {
        return { found: false, profile: null, entitlements: [] };
    }
    const { data, error } = await (supabase as any).rpc(DB_RPCS.LOOKUP_STUDENT_FOR_ENROLLMENT, {
        p_student_id: clean,
    });
    if (error) throw error;
    return (data ?? { found: false, profile: null, entitlements: [] }) as StudentEnrollmentLookupResult;
};

export const activateCourseForStudent = async (params: {
    studentId: string;
    seriesId: string;
    validityDays?: number | null;
    paymentId?: string | null;
    adminNote?: string | null;
}) => {
    const { data, error } = await (supabase as any).rpc(DB_RPCS.ADMIN_ACTIVATE_COURSE_ENTITLEMENT, {
        p_student_id: params.studentId.trim().toUpperCase(),
        p_series_id: params.seriesId,
        p_validity_days: params.validityDays ?? null,
        p_payment_id: params.paymentId ?? null,
        p_admin_note: params.adminNote ?? null,
    });
    if (error) throw error;
    invalidateCoursePurchaseCaches();
    return data;
};

export const rejectCoursePaymentRequest = async (params: {
    paymentId: string;
    adminNote?: string | null;
}) => {
    const { data, error } = await (supabase as any).rpc(DB_RPCS.ADMIN_REJECT_COURSE_PAYMENT_REQUEST, {
        p_payment_id: params.paymentId,
        p_admin_note: params.adminNote ?? null,
    });
    if (error) throw error;
    invalidateCoursePurchaseCaches();
    return data;
};

export const exportPaymentsToCSV = (payments: PaymentTransaction[]) => {
    if (payments.length === 0) return;

    const headers = [
        'Transaction ID',
        'Order Code',
        'Student ID',
        'Date',
        'User Name',
        'Course / Plan',
        'Amount (INR)',
        'Method',
        'UPI Reference',
        'Status',
        'Valid Until',
        'Razorpay Payment ID',
        'Razorpay Order ID',
    ];
    const rows = payments.map(p => [
        p.id,
        p.order_code || '',
        p.student_id || '',
        new Date(p.created_at).toISOString(),
        p.user_name || '',
        p.plan_purchased || '',
        resolvePaymentAmountInr(p),
        p.payment_method || '',
        p.upi_reference || '',
        p.status,
        p.valid_until || '',
        p.razorpay_payment_id || '',
        p.razorpay_order_id || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mindflow_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
