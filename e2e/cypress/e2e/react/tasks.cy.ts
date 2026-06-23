/// <reference types="cypress" />

describe('React · Tasks', () => {
  const email = 'e2e-react@ndlbl.com'
  const password = Cypress.env('testPassword') as string
  const otherEmail = 'e2e-react-b@ndlbl.com'

  beforeEach(() => {
    cy.task('db:cleanup', { emails: [email, otherEmail] })
    cy.task('db:seedVerifiedUser', { email, password })
    cy.loginByApi(email, password)
  })

  it('shows the empty state when the user has no tasks', () => {
    cy.visitAuthed('/tasks')
    cy.contains('No tasks yet.').should('be.visible')
  })

  it('creates a task through the UI and lists it', () => {
    const title = `Buy milk ${Date.now()}`
    cy.visitAuthed('/tasks')

    cy.contains('a', 'New task').click()
    cy.url().should('include', '/tasks/new')
    cy.get('input[name="title"]').type(title)
    cy.contains('button', 'Create task').click()

    cy.url().should('match', /\/tasks$/)
    cy.contains('li', title).should('be.visible')
  })

  it('displays a pre-existing (seeded) task', () => {
    cy.task('db:seedTask', { email, title: 'Seeded task', done: false })
    cy.visitAuthed('/tasks')
    cy.contains('li', 'Seeded task').should('be.visible')
  })

  it('edits a task through the UI', () => {
    cy.task('db:seedTask', { email, title: 'Original title' })
    cy.visitAuthed('/tasks')

    cy.contains('li', 'Original title').within(() => cy.contains('a', 'Edit').click())
    cy.url().should('include', '/edit')
    cy.get('input[name="title"]').clear().type('Updated title')
    cy.contains('button', 'Save changes').click()

    cy.url().should('match', /\/tasks$/)
    cy.contains('li', 'Updated title').should('be.visible')
    cy.contains('li', 'Original title').should('not.exist')
  })

  it('deletes a task', () => {
    cy.task('db:seedTask', { email, title: 'Delete me' })
    cy.visitAuthed('/tasks')

    cy.contains('li', 'Delete me').within(() => cy.contains('button', 'Delete').click())
    cy.contains('li', 'Delete me').should('not.exist')
  })

  it('toggles a task done/undone and updates the outstanding count', () => {
    cy.task('db:seedTask', { email, title: 'Task A', done: false })
    cy.task('db:seedTask', { email, title: 'Task B', done: false })
    cy.visitAuthed('/tasks')
    cy.contains('2 outstanding').should('be.visible')

    cy.contains('li', 'Task A').within(() => cy.get('input[type="checkbox"]').check())
    cy.contains('1 outstanding').should('be.visible')

    cy.contains('li', 'Task A').within(() => cy.get('input[type="checkbox"]').uncheck())
    cy.contains('2 outstanding').should('be.visible')
  })

  it('shows a validation error and blocks submit on an empty title', () => {
    cy.visitAuthed('/tasks/new')
    cy.contains('button', 'Create task').click()

    cy.contains('Title is required').should('be.visible')
    cy.url().should('include', '/tasks/new')
  })

  it("does not show another user's tasks", () => {
    cy.task('db:seedVerifiedUser', { email: otherEmail, password })
    cy.task('db:seedTask', { email: otherEmail, title: "Someone else's task" })

    cy.visitAuthed('/tasks')
    cy.contains('No tasks yet.').should('be.visible')
    cy.contains("Someone else's task").should('not.exist')
  })

  it("cannot edit or delete another user's task (404)", () => {
    cy.task('db:seedVerifiedUser', { email: otherEmail, password })
    cy.task('db:seedTask', { email: otherEmail, title: "Someone else's task" }).then(({ id }) => {
      const headers = { Authorization: `Bearer ${Cypress.env('authToken')}` }
      const url = `${Cypress.env('apiUrl')}/api/tasks/${id}`
      cy.request({ method: 'PATCH', url, headers, body: { title: 'hacked' }, failOnStatusCode: false })
        .its('status')
        .should('eq', 404)
      cy.request({ method: 'DELETE', url, headers, failOnStatusCode: false }).its('status').should('eq', 404)
    })
  })
})
