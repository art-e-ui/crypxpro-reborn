import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware if needed for APIs
  app.use(express.json());

  // API routes can be added here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback in development
    app.get('*all', (req, res, next) => {
      const url = req.originalUrl;
      // Skip for API or static-looking paths
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }
      import('fs').then(fs => {
        const templatePath = path.resolve(process.cwd(), 'index.html');
        const template = fs.readFileSync(templatePath, 'utf-8');
        vite.transformIndexHtml(url, template).then(transformed => {
          res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
        }).catch(e => {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        });
      }).catch(next);
    });
  } else {
    // In production, serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static files without trying to parse them as routes
    app.use(express.static(distPath, { index: false }));
    
    // SPA fallback: serve index.html for all non-file routes
    app.get('*all', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      
      const indexPath = path.join(distPath, 'index.html');
      try {
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8');
          
          const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
          const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
          
          html = html.replace('__VITE_SUPABASE_URL__', supabaseUrl);
          html = html.replace('__VITE_SUPABASE_ANON_KEY__', supabaseAnonKey);
          
          res.setHeader('Content-Type', 'text/html');
          return res.send(html);
        } else {
          return res.status(404).send('index.html not found');
        }
      } catch (err) {
        return next(err);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
