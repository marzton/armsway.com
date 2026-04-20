export interface Env {
	AUDIT_DB: D1Database;
	SEND_EMAIL: {
		send: (message: any) => Promise<void>;
	};
	CONTACT_TO_EMAIL: string;
	ENV: string;
	ASSETS: {
		fetch: (request: Request) => Promise<Response>;
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/api/contact' && request.method === 'POST') {
			return await handleContactForm(request, env);
		}

		return env.ASSETS.fetch(request);
	},
};

async function handleContactForm(request: Request, env: Env): Promise<Response> {
	try {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const company = formData.get('company') as string;
		const role = formData.get('role') as string;
		const inquiry = formData.get('inquiry') as string;
		const message = formData.get('message') as string;
		const formType = formData.get('formType') as string;
		const dedupeKey = formData.get('dedupeKey') as string;

		if (env.AUDIT_DB) {
			try {
				await env.AUDIT_DB.prepare(
					'INSERT INTO inquiries (name, email, company, role, inquiry, message, form_type, dedupe_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
				)
					.bind(name, email, company, role, inquiry, message, formType, dedupeKey, Date.now())
					.run();
			} catch (e) {
				console.error('D1 insert failed:', e);
			}
		}

		if (env.SEND_EMAIL) {
			const emailBody = `
New Inquiry from ${name} (${email})
Company: ${company}
Role: ${role}
Inquiry Type: ${inquiry}
Message: ${message}
`;

			try {
				// @ts-ignore
				const { EmailMessage } = await import('cloudflare:email');
				const msg = new EmailMessage(
					'no-reply@armsway.com',
					env.CONTACT_TO_EMAIL || 'rob@armsway.com',
					`New ArmsWay Inquiry: ${name}`,
					emailBody
				);
				await env.SEND_EMAIL.send(msg);
			} catch (e) {
				console.error('Failed to send email:', e);
			}
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
