export default async function handler(req, res) {
    // Enable CORS so your frontend can talk to your backend cleanly
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.body || req.query || {};

    if (!url) {
        return res.status(400).json({ error: "Missing video url parameter" });
    }

    // List of resilient fallback API processing nodes
    const apiNodes = [
        "https://api.cobalt.vip/",
        "https://cobalt-api.l99.lol/",
        "https://cobalt.api.unblock.casa/"
    ];

    // Loop through the processing nodes until one accepts the request
    for (const node of apiNodes) {
        try {
            const response = await fetch(node, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    videoQuality: '720',
                    downloadMode: 'auto'
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'redirect' || data.status === 'stream') {
                    return res.status(200).json({ url: data.url });
                } else if (data.status === 'picker' && data.picker.length > 0) {
                    return res.status(200).json({ url: data.picker[0].url });
                }
            }
        } catch (e) {
            console.error(`Node ${node} failed processing.`);
        }
    }

    return res.status(500).json({ error: "All backend processing nodes are temporarily rate-limited. Please try again." });
}
