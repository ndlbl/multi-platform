/// <reference types="cypress" />

describe('React · Library', () => {
  const email = 'e2e-react@ndlbl.com'
  const password = Cypress.env('testPassword') as string
  const otherEmail = 'e2e-react-b@ndlbl.com'

  beforeEach(() => {
    cy.task('db:cleanup', { emails: [email, otherEmail] })
    cy.task('db:seedVerifiedUser', { email, password })
    cy.loginByApi(email, password)
  })

  const openAddDialog = () => {
    cy.contains('button', 'Add new item').click()
    cy.get('#add-item-dialog').then(($d) => {
      const dialog = $d[0] as HTMLDialogElement
      if (!dialog.open) dialog.showModal()
    })
  }

  it('adds a book through the dialog and shows it in the list', () => {
    const title = `Clean Code ${Date.now()}`
    cy.visitAuthed('/library')
    openAddDialog()

    cy.get('#add-item-dialog').within(() => {
      cy.get('select[name="kind"]').select('book')
      cy.get('input[name="title"]').type(title)
      cy.get('input[name="author"]').type('Robert C. Martin')
      cy.get('input[name="pages"]').clear().type('464')
      cy.contains('button', 'Add to library').click()
    })

    cy.contains('h3', title).should('be.visible')
  })

  it('displays a pre-existing (seeded) book', () => {
    cy.task('db:seedLibraryItem', {
      email,
      item: { kind: 'book', title: 'Seeded Book', author: 'Jane Doe', pages: 123 },
    })
    cy.visitAuthed('/library')
    cy.contains('h3', 'Seeded Book').should('be.visible')
  })

  it('marks an item as consumed and the change persists', () => {
    cy.task('db:seedLibraryItem', {
      email,
      item: { kind: 'book', title: 'Toggle Book', author: 'A', pages: 10 },
    })
    cy.intercept('PATCH', '**/api/library/*').as('toggle')
    cy.visitAuthed('/library')

    cy.contains('li', 'Toggle Book').within(() => cy.get('input[type="checkbox"]').check())
    cy.wait('@toggle').its('response.statusCode').should('eq', 200)

    cy.visitAuthed('/library')
    cy.contains('li', 'Toggle Book').within(() => cy.get('input[type="checkbox"]').should('be.checked'))
  })

  it('removes an item', () => {
    cy.task('db:seedLibraryItem', {
      email,
      item: { kind: 'book', title: 'Remove Book', author: 'A', pages: 10 },
    })
    cy.visitAuthed('/library')

    cy.contains('li', 'Remove Book').within(() => cy.contains('button', 'Remove').click())
    cy.contains('h3', 'Remove Book').should('not.exist')
  })

  it('shows validation errors and blocks adding an incomplete book', () => {
    cy.visitAuthed('/library')
    openAddDialog()

    cy.get('#add-item-dialog').within(() => {
      cy.contains('button', 'Add to library').click()
      cy.contains('Title is required').should('be.visible')
      cy.contains('Author is required').should('be.visible')
    })
  })

  it("does not show another user's library items", () => {
    cy.task('db:seedVerifiedUser', { email: otherEmail, password })
    cy.task('db:seedLibraryItem', {
      email: otherEmail,
      item: { kind: 'book', title: "Someone else's book", author: 'X', pages: 1 },
    })
    cy.visitAuthed('/library')
    cy.contains("Someone else's book").should('not.exist')
  })

  it("cannot edit or delete another user's library item (404)", () => {
    cy.task('db:seedVerifiedUser', { email: otherEmail, password })
    cy.task('db:seedLibraryItem', {
      email: otherEmail,
      item: { kind: 'book', title: "Someone else's book", author: 'X', pages: 1 },
    }).then(({ id }) => {
      const headers = { Authorization: `Bearer ${Cypress.env('authToken')}` }
      const url = `${Cypress.env('apiUrl')}/api/library/${id}`
      cy.request({ method: 'PATCH', url, headers, body: { title: 'hacked' }, failOnStatusCode: false })
        .its('status')
        .should('eq', 404)
      cy.request({ method: 'DELETE', url, headers, failOnStatusCode: false }).its('status').should('eq', 404)
    })
  })
})
