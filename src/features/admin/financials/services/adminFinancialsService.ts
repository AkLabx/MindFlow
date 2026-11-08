import { supabase } from '@/lib/supabase';

export interface PaymentTransaction {
    id: string;
    created_at: string;
    user_id: string | null;
    razorpay_payment_id: string | null;
    razorpay_order_id: string | null;
    amount: number | null;
    currency: string | null;
    status: string;
    plan_purchased: string | null;
    webhook_payload?: any;
    user_name?: string;
    user_email?: string;
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
    failedCount: number;
    plansCount: Record<string, number>;
    subscriptionStats: SubscriptionStats;
}

export const fetchFinancialData = async (): Promise<{
    payments: PaymentTransaction[];
    metrics: FinancialMetrics;
}> => {
    // 1. Fetch payments
    const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
    }

    const rawPayments = (paymentsData as PaymentTransaction[]) || [];

    // 2. Fetch distinct user_ids to get profile names
    const userIds = Array.from(new Set(rawPayments.map(p => p.user_id).filter(Boolean))) as string[];
    let profilesMap: Record<string, { full_name?: string; username?: string }> = {};

    if (userIds.length > 0) {
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, username')
            .in('id', userIds);

        if (profilesData) {
            profilesMap = profilesData.reduce((acc, p) => {
                acc[p.id] = { full_name: p.full_name, username: p.username };
                return acc;
            }, {} as Record<string, { full_name?: string; username?: string }>);
        }
    }

    // Attach profile info
    const payments: PaymentTransaction[] = rawPayments.map(p => {
        const profile = p.user_id ? profilesMap[p.user_id] : undefined;
        return {
            ...p,
            user_name: profile?.full_name || profile?.username || (p.user_id ? `User ${p.user_id.slice(0, 8)}` : 'Anonymous / Guest')
        };
    });

    // 3. Fetch subscription tiers from profiles
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

    // 4. Calculate metrics
    let totalRevenueInr = 0;
    let successfulCount = 0;
    let failedCount = 0;
    const plansCount: Record<string, number> = {};

    payments.forEach(p => {
        const isSuccess = p.status.includes('captured') || p.status === 'success';
        if (isSuccess) {
            successfulCount++;
            // If amount looks like paise (e.g. 49900 = ₹499), divide by 100
            const rawAmount = p.amount || 0;
            const amtInInr = rawAmount >= 1000 ? rawAmount / 100 : rawAmount;
            totalRevenueInr += amtInInr;
        } else if (p.status.includes('fail')) {
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
            failedCount,
            plansCount,
            subscriptionStats
        }
    };
};

export const exportPaymentsToCSV = (payments: PaymentTransaction[]) => {
    if (payments.length === 0) return;

    const headers = ['Transaction ID', 'Date', 'User Name', 'User ID', 'Plan', 'Amount (INR)', 'Currency', 'Status', 'Razorpay Payment ID', 'Razorpay Order ID'];
    const rows = payments.map(p => [
        p.id,
        new Date(p.created_at).toISOString(),
        p.user_name || '',
        p.user_id || '',
        p.plan_purchased || '',
        p.amount || 0,
        p.currency || 'INR',
        p.status,
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
