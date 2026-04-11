/**
 * Razorpay webhooks: activate Pro on subscription, downgrade on cancel/complete.
 * Secrets: RAZORPAY_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
 * Dashboard: enable subscription.activated, subscription.charged, subscription.cancelled, subscription.completed
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

type RazorpayEvent = {
	event?: string;
	payload?: {
		subscription?: { entity?: Record<string, unknown> };
	};
};

function verifySignature(rawBody: string, secret: string, headerSig: string | null): boolean {
	if (!headerSig) return false;
	const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
	return expected === headerSig;
}

function getUserIdFromSubscriptionEntity(entity: Record<string, unknown> | undefined): string | null {
	if (!entity) return null;
	const notes = entity.notes as Record<string, unknown> | undefined;
	const uid = notes?.supabase_user_id;
	if (typeof uid === 'string' && uid.length > 0) return uid;
	return null;
}

Deno.serve(async (req) => {
	const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
	if (!webhookSecret) {
		return new Response('Webhook secret not configured', { status: 500 });
	}

	const rawBody = await req.text();
	const sig = req.headers.get('x-razorpay-signature');

	if (!verifySignature(rawBody, webhookSecret, sig)) {
		return new Response(JSON.stringify({ error: 'Invalid signature' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let body: RazorpayEvent;
	try {
		body = JSON.parse(rawBody) as RazorpayEvent;
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
	}

	const event = body.event;
	const subWrap = body.payload?.subscription as { entity?: Record<string, unknown> } | Record<string, unknown> | undefined;
	const entity = (
		subWrap && 'entity' in subWrap && subWrap.entity
			? subWrap.entity
			: subWrap && 'id' in subWrap
				? (subWrap as Record<string, unknown>)
				: undefined
	) as Record<string, unknown> | undefined;

	const supabase = createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
	);

	const userId = getUserIdFromSubscriptionEntity(entity);

	try {
		if (event === 'subscription.activated' || event === 'subscription.charged') {
			if (!userId) {
				console.warn('razorpay webhook: missing supabase_user_id in subscription notes');
				return new Response(JSON.stringify({ received: true }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const customerId = typeof entity?.customer_id === 'string' ? entity.customer_id : null;
			const { error } = await supabase
				.from('User')
				.update({
					plan: 'paid',
					razorpay_customer_id: customerId,
					updated_at: new Date().toISOString()
				})
				.eq('id', userId);

			if (error) console.error('razorpay webhook upgrade', error);
		}

		if (event === 'subscription.cancelled' || event === 'subscription.completed') {
			let uid = userId;
			const customerId =
				typeof entity?.customer_id === 'string' ? entity.customer_id : null;

			if (!uid && customerId) {
				const { data: row } = await supabase
					.from('User')
					.select('id')
					.eq('razorpay_customer_id', customerId)
					.maybeSingle();
				uid = row?.id ?? null;
			}

			if (uid && typeof uid === 'string') {
				const { error } = await supabase
					.from('User')
					.update({ plan: 'free', updated_at: new Date().toISOString() })
					.eq('id', uid);
				if (error) console.error('razorpay webhook downgrade', error);
			}
		}
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}

	return new Response(JSON.stringify({ received: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
});
