# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

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
