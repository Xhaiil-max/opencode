import { AccessToken } from "livekit-server-sdk";

export default {
  async fetch(request: Request): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const { roomName, participantName } = await request.json();

    if (!roomName || !participantName) {
      return new Response("Missing roomName or participantName", { status: 400, headers: corsHeaders });
    }

    const apiKey = "APISedt2gmM6eXH";
    const apiSecret = "evc9FEfkX5LDPHXWJ0TGh4kKe16YUdDKfxxPEDFfWnzB";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: "1h",
    });

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    return new Response(JSON.stringify({ token, url: "wss://meet-agvwxthm.livekit.cloud" }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  },
};
