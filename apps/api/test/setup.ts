process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://pazaryeri:pazaryeri@localhost:5432/pazaryeri?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.OPENSEARCH_URL = process.env.OPENSEARCH_URL ?? 'http://localhost:9200';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-minimum-32-characters';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimum-32-characters';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001';
process.env.CSRF_SECRET =
  process.env.CSRF_SECRET ?? 'test-csrf-secret-minimum-32-characters';
