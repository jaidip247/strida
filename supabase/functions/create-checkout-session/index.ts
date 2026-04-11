/**
 * Creates a Razorpay Subscription and returns the hosted checkout URL (short_url).
 * Supports cards (credit/debit), UPI, netbanking, etc. per Razorpay account settings.
 * Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID
 * Optional: RAZORPAY_SUBSCRIPTION_TOTAL_COUNT (default 120 billing cycles)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function getAuthHeader(): string {
	const keyId = Deno.env.get('RAZORPAY_KEY_ID');
	const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
	if (!keyId || !keySecret) {
		throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set');
	}
	const token = btoa(`${keyId}:${keySecret}`);
	return `Basic ${token}`;
}

async function razorpayPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
	const res = await fetch(`https://api.razorpay.com/v1${path}`, {
		method: 'POST',
		headers: {
			Authorization: getAuthHeader(),
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	const data = (await res.json()) as T & { error?: { description?: string; code?: string } };
	if (!res.ok) {
		const msg = data.error?.description || JSON.stringify(data);
		throw new Error(msg);
	}
	return data;
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const planId = Deno.env.get('RAZORPAY_PLAN_ID');
		if (!planId) {
			return new Response(JSON.stringify({ error: 'RAZORPAY_PLAN_ID is not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const authHeader = req.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const jwt = authHeader.replace('Bearer ', '');
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL')!,
			Deno.env.get('SUPABASE_ANON_KEY')!,
			{ global: { headers: { Authorization: authHeader } } }
		);

		const {
			data: { user },
			error: userErr
		} = await supabase.auth.getUser(jwt);

		if (userErr || !user) {
			return new Response(JSON.stringify({ error: 'Invalid session' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const totalCountRaw = Deno.env.get('RAZORPAY_SUBSCRIPTION_TOTAL_COUNT') || '120';
		const totalCount = Math.min(999, Math.max(1, parseInt(totalCountRaw, 10) || 120));
		const expireBy = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

		const name =
			(typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
			user.email?.split('@')[0] ||
			'Strida user';

		let customerId: string | undefined;
		const { data: row, error: rowErr } = await supabase
			.from('User')
			.select('razorpay_customer_id')
			.eq('id', user.id)
			.maybeSingle();

		if (!rowErr && row?.razorpay_customer_id && typeof row.razorpay_customer_id === 'string') {
			customerId = row.razorpay_customer_id;
		} else {
			const cust = await razorpayPost<{ id: string }>('/customers', {
				name,
				email: user.email ?? undefined,
				fail_existing: '0',
				notes: { supabase_user_id: user.id }
			});
			customerId = cust.id;
			const { error: upErr } = await supabase
				.from('User')
				.update({ razorpay_customer_id: cust.id, updated_at: new Date().toISOString() })
				.eq('id', user.id);
			if (upErr) console.error('save razorpay_customer_id', upErr);
		}

		const subBody: Record<string, unknown> = {
			plan_id: planId,
			total_count: totalCount,
			quantity: 1,
			customer_notify: true,
			expire_by: expireBy,
			notes: { supabase_user_id: user.id },
			customer_id: customerId,
			...(user.email
				? {
						notify_info: {
							notify_email: user.email
						}
					}
				: {})
		};

		const sub = await razorpayPost<{ short_url?: string; id?: string }>('/subscriptions', subBody);

		const url = sub.short_url;
		if (typeof url === 'string' && url.startsWith('http')) {
			return new Response(JSON.stringify({ url }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		return new Response(
			JSON.stringify({ error: 'Razorpay did not return a checkout URL', subscription_id: sub.id }),
			{ status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
