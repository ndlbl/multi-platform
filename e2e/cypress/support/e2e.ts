// Loaded before every spec. Pulls in our custom commands.
import './commands'

// React Router (framework mode) server-renders pages then hydrates on the client.
// In dev, a benign hydration mismatch *throws* — but the app recovers and works.
// Ignore only hydration errors so they don't fail tests; any other uncaught
// exception (a real app crash) still fails the test as it should.
Cypress.on('uncaught:exception', (err) => {
  if (/hydrat/i.test(err.message)) return false
  return undefined
})

