/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Log in via the API (no UI) and stash the JWT for a subsequent visitAuthed().
       * Use this in tests whose subject ISN'T the login UI (tasks, library) so they
       * stay fast and aren't coupled to the login screen. Hits the API directly,
       * so it's identical for Angular and React.
       */
      loginByApi(email?: string, password?: string): Chainable<void>
      /**
       * Visit a route already authenticated, by injecting the token captured by
       * loginByApi() into localStorage before the app bootstraps.
       */
      visitAuthed(path: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('loginByApi', (email?: string, password?: string) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/api/auth/login`, {
    email: email ?? '',
    password: password ?? Cypress.env('testPassword'),
  }).then((res) => {
    expect(res.status).to.eq(200)
    Cypress.env('authToken', res.body.token)
  })
})

Cypress.Commands.add('visitAuthed', (path: string) => {
  const token = Cypress.env('authToken')
  cy.visit(path, {
    // AuthService reads 'auth-token' from localStorage when it's constructed.
    onBeforeLoad: (win) => win.localStorage.setItem('auth-token', token),
  })
})

export {}
