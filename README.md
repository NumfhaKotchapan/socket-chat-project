# Online chat via Socket programming

## Testing from other devices on the same LAN

If you want to open the frontend on a phone or another PC and connect to the backend running on your development machine, follow these steps:

1. Find your development machine's LAN IPv4 address (on Windows run `ipconfig` and look for "IPv4 Address" under your active adapter).
2. Start the backend server (default port 3001):

	- From the backend folder: `node index.js` or `npm run start` depending on your setup.

3. Start the frontend with host enabled so other devices can reach the Vite dev server:

	- In the frontend folder: `npm run dev -- --host` or set `server.host = true` in `vite.config.js` (already set in this project).

4. Configure the frontend to connect to the backend by setting `VITE_SERVER_URL` in an env file or by creating `.env.local` with:

	VITE_SERVER_URL=http://<YOUR_LAN_IP>:3001

	Example: `VITE_SERVER_URL=http://192.168.1.10:3001`.

5. Make sure your OS firewall allows incoming connections on the backend port (3001), or add a rule for Node.

6. Open the frontend from the other device using the dev server address, e.g. `http://192.168.1.10:5173` (or whatever port Vite reports).

Notes:
- If the other device is not on the same LAN you'll need port forwarding on your router or a tunneling service (ngrok, localtunnel) or deploy to a public server.
- For production, use a proper hostname/HTTPS and tighten CORS origins instead of `*`.
