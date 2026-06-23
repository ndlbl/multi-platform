/// <reference types="cypress" />

describe('Angular · Login flow', () => {
  const email = 'e2e-ng@ndlbl.com'
  const password = Cypress.env('testPassword') as string

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.task('db:cleanup', { emails: [email] })
    cy.task('db:seedVerifiedUser', { email, password })
  })

  it('logs a verified user in through the UI', () => {
    cy.visit('/login')
    cy.get('input[formControlName="email"]').type(email)
    cy.get('input[formControlName="password"]').type(password)
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/tasks')
    cy.contains('h2', 'Your tasks').should('be.visible')
    cy.window().its('localStorage.auth-token').should('be.a', 'string')
  })

  it('shows an error and stays put on a wrong password', () => {
    cy.visit('/login')
    cy.get('input[formControlName="email"]').type(email)
    cy.get('input[formControlName="password"]').type('Wrong-Pass123!')
    cy.get('button[type="submit"]').click()

    cy.contains('Invalid email or password').should('be.visible')
    cy.url().should('include', '/login')
  })
})
