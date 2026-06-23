import { defineConfig } from 'cypress'

import * as seed from './cypress/tasks/seed'

// Shared Cypress project for BOTH frontends. baseUrl is overridden per app via
// the npm scripts (Angular :4200, React :5173); specs live under
// cypress/e2e/<framework>/. Seed tasks + custom commands are shared.
export default defineConfig({
  // macOS resolves `localhost` to IPv6 ::1 (where the dev servers bind), but
  // Cypress's bundled runtime dials IPv4 127.0.0.1 first and can't be swayed by
  // NODE_OPTIONS (packaged Electron strips them). Override DNS in Cypress's own
  // proxy so it connects to ::1 while still sending the allowed Host `localhost`.
  hosts: {
    localhost: '::1',
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    setupNodeEvents(on, config) {
      on('task', {
        'db:seedVerifiedUser': (args) => seed.seedVerifiedUser(args),
        'db:seedUnverifiedUser': (args) => seed.seedUnverifiedUser(args),
        'db:seedOtp': (args) => seed.seedOtp(args),
        'db:seedTask': (args) => seed.seedTask(args),
        'db:seedLibraryItem': (args) => seed.seedLibraryItem(args),
        'db:cleanup': (args) => seed.cleanup(args),
      })
      return config
    },
  },
  env: {
    // cy.request hits the API directly (not via each app's proxy) so auth setup
    // is identical regardless of which frontend is under test.
    apiUrl: 'http://localhost:3003',
    // Shared password for all framework-namespaced e2e accounts.
    // Each spec defines its own email constants (e2e-ng-*, e2e-react-*, e2e-vue-*)
    // so suites can run concurrently without DB conflicts.
    testPassword: 'E2e-Pass123!',
  },
})
