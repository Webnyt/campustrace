import app from '../server.js';

// Let Express read JSON bodies. Vercel would otherwise consume the stream first.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
