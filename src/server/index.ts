import { createApiApp, getDefaultRuntime } from "@/server/app";
import { serve } from "@hono/node-server";

const runtime = await getDefaultRuntime();
const app = createApiApp(runtime);

serve(
  {
    fetch: app.fetch,
    port: runtime.config.port,
  },
  (info) => {
    console.log(`Medical app API running on http://localhost:${info.port}`);
  },
);
