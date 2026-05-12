// Stub for `server-only` package in Vitest. The real package throws on import
// outside of react-server context to prevent client bundling. In Node-based
// tests we just want it to be a no-op.
export {};
