# Ndalo Bloom Engineering Standards

## 1. General

Write production-quality software.

Prioritize:

- Readability
- Maintainability
- Testability
- Security
- Performance
- Accessibility

---

# 2. Architecture

Prefer modular architecture.

Separate:

- UI
- Application logic
- Domain logic
- Data access
- External services
- AI services

Avoid unnecessary coupling.

---

# 3. Type Safety

Use strong typing wherever supported.

Avoid unnecessary:

- `any`
- Untyped objects
- Implicit contracts
- Duplicate type definitions

---

# 4. Validation

Validate data at system boundaries.

Never assume:

- User input is valid
- API input is valid
- AI output is valid
- Third-party responses are valid

---

# 5. Error Handling

Errors should:

- Be handled intentionally
- Provide useful developer information
- Provide safe customer-facing messages
- Avoid leaking sensitive information

---

# 6. Security

Security must be considered when implementing every feature.

Never:

- Commit secrets
- Expose private keys
- Trust client-side authorization
- Trust AI output blindly
- Trust payment callbacks without verification

---

# 7. Database

Use migrations.

Do not make undocumented schema changes.

Consider:

- Indexes
- Constraints
- Relationships
- Transactions
- Data integrity

---

# 8. API Design

APIs should be:

- Predictable
- Validated
- Secure
- Consistent
- Versionable where necessary

Do not expose internal database implementation unnecessarily.

---

# 9. Components

Build reusable components where reuse improves consistency.

Do not create abstractions merely for the sake of abstraction.

---

# 10. Performance

Avoid:

- Unnecessary network requests
- Large client bundles
- Unoptimized images
- Blocking third-party scripts
- Excessive client-side rendering
- Unnecessary polling

---

# 11. Testing

Critical business logic must be tested.

Critical customer journeys must have end-to-end coverage.

Priority journeys include:

- Product discovery
- Search
- Add to cart
- Checkout
- Payment
- Order confirmation
- AI recommendations
- Gift Finder

---

# 12. Git

Use meaningful commits.

Do not commit:

- Secrets
- Debug code
- Temporary files
- Build artefacts

Pull requests should be reviewable and focused.

---

# 13. Documentation

Document important architectural decisions.

Avoid documenting obvious code.

Documentation should explain:

- Why
- Constraints
- Decisions
- Trade-offs

---

# 14. Dependencies

Do not add dependencies without a reason.

For every significant dependency ask:

- Do we need it?
- Is it maintained?
- Is it secure?
- What does it cost?
- Can we reasonably avoid it?

---

# 15. Third-Party Services

Treat external services as replaceable integrations.

Wrap important third-party functionality behind application-level interfaces where practical.

---

# 16. Definition of Done

A feature is not complete until:

- Requirements are satisfied
- Acceptance criteria pass
- Tests pass
- Type checking passes
- Linting passes
- Security implications are considered
- Accessibility is considered
- Performance implications are considered
- Documentation is updated where necessary
- The implementation has been reviewed against the Product Brief