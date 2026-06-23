/// <reference types="cypress" />

describe('React · Registration flow', () => {
  const REGISTER_EMAIL = 'e2e-react-register@ndlbl.com'
  const VERIFY_EMAIL = 'e2e-react-verify@ndlbl.com'
  const PASSWORD = Cypress.env('testPassword') as string

  beforeEach(() => {
    cy.task('db:cleanup', { emails: [REGISTER_EMAIL, VERIFY_EMAIL] })
  })

  it('submits the registration form and reaches the email-verification stage', () => {
    cy.visit('/register')
    cy.get('input[name="email"]').type(REGISTER_EMAIL)
    cy.get('input[name="password"]').type(PASSWORD)
    cy.get('input[name="confirm"]').type(PASSWORD)
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/verify-email')
    cy.contains('h2', 'Verify your email').should('be.visible')
    cy.get('input[name="email"]').should('have.value', REGISTER_EMAIL)
  })

  it('completes verification with a seeded OTP and logs the user in', () => {
    cy.task('db:seedUnverifiedUser', { email: VERIFY_EMAIL, password: PASSWORD })
    cy.task('db:seedOtp', { email: VERIFY_EMAIL, code: 'TEST01', purpose: 'register' })

    cy.visit(`/verify-email?email=${encodeURIComponent(VERIFY_EMAIL)}`)
    cy.get('input[name="email"]').should('have.value', VERIFY_EMAIL)
    cy.get('input[name="code"]').type('TEST01')
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/tasks')
    cy.window().its('localStorage.auth-token').should('be.a', 'string')
  })
})
