export interface Env {
	AUDIT_DB: D1Database;
	SEND_EMAIL: {
		send: (message: any) => Promise<void>;
	};
	CACHE_KV: KVNamespace;
	INQUIRY_QUEUE: Queue;
	UTILS_SERVICE: Fetcher;
	CONTACT_TO_EMAIL: string;
	ENV: string;
	ASSETS: {
		fetch: (request: Request) => Promise<Response>;
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Basic KV cache for assets or public info if needed
		if (url.pathname === '/api/info') {
			const cached = await env.CACHE_KV.get('site_info');
			if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json' } });
		}

		if (url.pathname === '/api/contact' && request.method === 'POST') {
			return await handleContactForm(request, env, ctx);
		}

		return env.ASSETS.fetch(request);
	},

	async email(message: any, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log(`Received email from ${message.from} to ${message.to}`);
		// Forward or process incoming emails to armsway.com
	},

	async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
		for (const message of batch.messages) {
			const inquiry = message.body;
			console.log(`Processing queued inquiry: ${inquiry.dedupeKey}`);

			// Actual email sending logic offloaded to queue
			if (env.SEND_EMAIL) {
				const emailBody = `
New Inquiry from ${inquiry.name} (${inquiry.email})
Company: ${inquiry.company}
Role: ${inquiry.role}
Inquiry Type: ${inquiry.inquiry}
Message: ${inquiry.message}
`;
				try {
					// @ts-ignore
					const { EmailMessage } = await import('cloudflare:email');
					const msg = new EmailMessage(
						'no-reply@armsway.com',
						env.CONTACT_TO_EMAIL || 'rob@armsway.com',
						`New ArmsWay Inquiry: ${inquiry.name}`,
						emailBody
					);
					await env.SEND_EMAIL.send(msg);
				} catch (e) {
					console.error('Queue email send failed:', e);
				}
			}
		}
	}
};

async function handleContactForm(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	try {
		const formData = await request.formData();
		const inquiryData = {
			name: formData.get('name') as string,
			email: formData.get('email') as string,
			company: formData.get('company') as string,
			role: formData.get('role') as string,
			inquiry: formData.get('inquiry') as string,
			message: formData.get('message') as string,
			formType: formData.get('formType') as string,
			dedupeKey: formData.get('dedupeKey') as string,
			created_at: Date.now()
		};

		// 1. Audit to D1
		if (env.AUDIT_DB) {
			await env.AUDIT_DB.prepare(
				'INSERT INTO inquiries (name, email, company, role, inquiry, message, form_type, dedupe_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
			)
				.bind(inquiryData.name, inquiryData.email, inquiryData.company, inquiryData.role, inquiryData.inquiry, inquiryData.message, inquiryData.formType, inquiryData.dedupeKey, inquiryData.created_at)
				.run();
		}

		// 2. Offload to Queue for asynchronous email processing
		if (env.INQUIRY_QUEUE) {
			await env.INQUIRY_QUEUE.send(inquiryData);
		}

		// 3. Optional call to Utils Service
		if (env.UTILS_SERVICE) {
			ctx.waitUntil(env.UTILS_SERVICE.fetch('https://utils.goldshore.ai/log-event', {
				method: 'POST',
				body: JSON.stringify({ event: 'inquiry_received', key: inquiryData.dedupeKey })
			}));
		}

		return new Response(JSON.stringify({ ok: true }), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			},
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ ok: false, error: { message: err.message } }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			},
		});
	}
}
