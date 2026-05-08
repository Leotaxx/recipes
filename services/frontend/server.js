import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(express.static("public"));
app.use("/api/catalog", createProxyMiddleware({
  target: process.env.CATALOG_API_URL || "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: { "^/api/catalog": "" }
}));
app.use("/api/recommendations", createProxyMiddleware({
  target: process.env.RECOMMENDATION_API_URL || "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: { "^/api/recommendations": "" }
}));

app.listen(port, () => {
  console.log(`frontend listening on ${port}`);
});

