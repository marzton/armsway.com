export interface Env {
	AUDIT_DB: D1Database;
	SEND_EMAIL: {
		send: (message: any) => Promise<void>;
	};
	CACHE_KV: KVNamespace;
	INQUIRY_QUEUE: Queue;
	CONTACT_TO_EMAIL: string;
	ENV: string;
	ASSETS: {
		fetch: (request: Request) => Promise<Response>;
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({service:'armsway-com',ok:Boolean(env.ASSETS),inquiries:env.INQUIRY_QUEUE ? 'available' : 'unavailable'});


		if (url.pathname === '/api/info') {
			const cached = await env.CACHE_KV?.get('site_info');
			if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json' } });
		}

		if (url.pathname === '/api/contact' && request.method === 'POST') {
			return await handleContactForm(request, env, ctx);
		}

		if (url.pathname.startsWith('/api/')) return Response.json({error:'Not found'}, {status:404});
		return env.ASSETS.fetch(request);
	},

	async email(message: any, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log(`Received email from ${message.from} to ${message.to}`);
	},

	async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
		for (const message of batch.messages) {
			const inquiry = message.body;
			console.log(`Processing queued inquiry: ${inquiry.dedupeKey}`);

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
					const from = 'no-reply@armsway.com';
					const to = env.CONTACT_TO_EMAIL || 'rob@armsway.com';
					const subject = `New ArmsWay Inquiry: ${inquiry.name}`;
					const rawMessage = [
						`From: ${from}`,
						`To: ${to}`,
						`Subject: ${subject}`,
						'MIME-Version: 1.0',
						'Content-Type: text/plain; charset=UTF-8',
						'',
						emailBody
					].join('\r\n');

					const msg = new EmailMessage(from, to, rawMessage);
					await env.SEND_EMAIL.send(msg);
				} catch (e) {
					console.error('Queue email send failed, retrying message:', e);
					message.retry();
				}
			}
		}
	}
};

async function handleContactForm(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.AUDIT_DB || !env.INQUIRY_QUEUE) return Response.json({ok:false,error:{message:'Online intake is temporarily unavailable. Email rob@armsway.com directly.'}},{status:503});

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

		if (env.AUDIT_DB) {
			await env.AUDIT_DB.prepare(
				'INSERT INTO inquiries (name, email, company, role, inquiry, message, form_type, dedupe_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
			)
				.bind(inquiryData.name, inquiryData.email, inquiryData.company, inquiryData.role, inquiryData.inquiry, inquiryData.message, inquiryData.formType, inquiryData.dedupeKey, inquiryData.created_at)
				.run();
		}

		if (env.INQUIRY_QUEUE) {
			await env.INQUIRY_QUEUE.send(inquiryData);
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
