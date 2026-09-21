# Ndalo Bloom AI Product & Engineering Guidelines

## Purpose

AI is a core part of Ndalo Bloom, but AI must remain subordinate to product truth, customer trust and commerce logic.

---

# 1. AI Is an Experience Layer

AI should help customers:

- Discover
- Decide
- Personalize
- Gift
- Explore

AI should not become the source of truth for commerce.

---

# 2. Trusted Data

The following must always come from application data:

- Product name
- Price
- Stock
- Ingredients
- Product attributes
- Product availability
- Shipping
- Promotions
- Order status
- Payment status

---

# 3. No Hallucinated Product Claims

AI must not invent:

- Ingredients
- Health benefits
- Medical benefits
- Product specifications
- Certifications
- Customer reviews
- Pricing
- Discounts
- Availability

---

# 4. Structured AI Outputs

Where possible, AI should return structured data rather than uncontrolled text.

For example:

```text
{
  intent,
  mood,
  occasion,
  budget,
  recommendedProductIds,
  explanation
}
```

The application should validate the returned data before presenting it.

---

# 5. Product IDs

AI should reference products using trusted internal identifiers.

Do not allow the AI to invent product IDs.

---

# 6. Recommendations

AI recommendations should be explainable.

Prefer:

> "We chose this because you said you wanted a calming evening ritual."

over:

> "AI recommends this product."

---

# 7. AI Gift Finder

The Gift Finder should gather only the information necessary to produce useful recommendations.

Potential information:

- Recipient
- Occasion
- Relationship
- Budget
- Preferences
- Mood
- Product interests

---

# 8. Gift Messages

AI-generated messages must always be editable.

The customer owns the final message.

---

# 9. Privacy

Do not send unnecessary customer information to AI providers.

Minimize personal data.

Never expose:

- Passwords
- Payment details
- Authentication secrets
- Sensitive internal data

to AI models.

---

# 10. Provider Independence

AI providers should be abstracted behind an application-level service.

The commerce application should not be tightly coupled to one provider.

---

# 11. Cost Awareness

AI calls should be treated as a cost-bearing operation.

Consider:

- Caching
- Prompt efficiency
- Model selection
- Rate limits
- Request limits
- Fallbacks
- Usage monitoring

---

# 12. Graceful Failure

If AI is unavailable:

The website must still function.

Customers must still be able to:

- Browse
- Search
- Add to cart
- Checkout
- Purchase

AI must enhance commerce, not become a single point of failure.

---

# 13. Human Review

AI-generated:

- Marketing content
- Product copy
- Campaign content
- SEO content

should require appropriate human review before publication.

---

# 14. AI UX

AI should feel:

- Helpful
- Warm
- Clear
- Fast
- Human
- Non-judgmental

Avoid making AI unnecessarily conversational when the customer simply wants to buy something.

---

# 15. Measure AI

Track:

- AI usage
- AI-assisted conversion
- Recommendation interaction
- Gift Finder completion
- Search success
- AI-assisted AOV

The purpose is to determine whether AI genuinely improves the customer experience.