# Integration Layer

Provider adapters behind application-level interfaces. The only place third-party provider
SDKs are imported.

## Rules

- Provider SDKs are restricted to this layer (enforced by ESLint + architecture tests).
- Each provider category exposes an interface; concrete adapters implement it.
- In the Foundation Spec only interfaces exist; concrete adapters (PayFast, Payflex,
  PayJustNow, Bob Go, Cloudinary, Resend, OpenAI, PostHog) are implemented in later Specs.
