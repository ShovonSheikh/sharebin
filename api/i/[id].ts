import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid id parameter' });
    }

    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
        console.error('VITE_SUPABASE_ANON_KEY environment variable is not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseUrl = `https://ofqcpzwdbiobddhcqknv.supabase.co/functions/v1/api-pastes/img?id=${id}`;

    try {
        const response = await fetch(supabaseUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Supabase error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({
                error: 'Failed to fetch image',
                details: errorText
            });
        }

        // Get the content type from the response
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // Get the raw image bytes
        const imageBuffer = await response.arrayBuffer();

        // Set response headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        // Send the image bytes
        return res.send(Buffer.from(imageBuffer));
    } catch (error) {
        console.error('Error fetching image:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
