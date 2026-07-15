import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@turkiye-pazaryeri/types'],
  // Separate trust boundary: admin CSP configured in Phase 4
};

export default withNextIntl(nextConfig);
