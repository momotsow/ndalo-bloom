# Ndalo Bloom
## Master Product Brief

**Document Status:** Master Source of Truth  
**Project:** Ndalo Bloom  
**Product Type:** Luxury Self-Care E-Commerce Platform  
**Primary Market:** South Africa  
**Primary Experience:** Mobile-first, social-first, AI-forward luxury self-care commerce

---

# 1. Brand

## Brand Name

**Ndalo Bloom**

Ndalo Bloom is a premium self-care and gifting brand designed around one central idea:

> **Ndalo Bloom is time for you.**

The brand does not simply sell bath salts, candles, soaps and body-care products.

It sells the feeling of:

- Slowing down
- Being cared for
- Creating a personal ritual
- Having a moment to yourself
- Feeling beautiful
- Feeling restored
- Giving someone meaningful self-care
- Turning an ordinary evening into something special

## North Star

> **Make time for you.**

## Brand Promise

> **Ndalo Bloom transforms ordinary self-care into a luxurious personal ritual.**

---

# 2. Brand Positioning

Ndalo Bloom should occupy the intersection of:

- Luxury
- Self-care
- Beauty
- Wellness
- Gifting
- Personalization
- Social culture
- Technology

The digital experience should feel:

- Luxurious
- Feminine
- Modern
- Trendy
- Editorial
- Sensory
- Warm
- Personal
- Aspirational
- Shareable

It should not feel:

- Generic
- Corporate
- Clinical
- Cheap
- Childish
- Overly complicated
- Artificially luxurious
- Like a technology demonstration

Technology should disappear into the experience.

---

# 3. Target Customer

## Primary Persona: "The Busy Bloom"

A core Ndalo Bloom customer is approximately 30 years old.

She may be:

- A young professional
- A working mother
- Busy
- Mentally overloaded
- Constantly caring for other people
- Looking for small moments of peace
- Interested in beauty and self-care
- Active on social media
- Comfortable shopping online
- Attracted to beautiful packaging
- Willing to spend more for a premium experience

She often does not need another product.

She needs permission to stop.

Ndalo Bloom should help her discover that moment.

---

# 4. Customer Problem

Modern customers often have:

- Very little free time
- Too many responsibilities
- Decision fatigue
- Difficulty prioritising themselves
- Difficulty finding meaningful gifts
- Too many generic online shopping experiences

Ndalo Bloom should reduce the effort required to discover the right self-care experience.

The customer should feel:

> "This brand understands what I need."

---

# 5. Customer Journey

The core customer journey is:

```text
Discover
   ↓
Explore
   ↓
Personalize
   ↓
Purchase
   ↓
Receive
   ↓
Unbox
   ↓
Share
   ↓
Return
```

Every part of the product should reinforce this journey.

---

# 6. Product Categories

Initial product categories may include:

- Bath salts
- Candles
- Soap
- Body scrub
- Diffusers

Future categories may include:

- Bath bombs
- Body oils
- Body butter
- Body lotions
- Gift boxes
- Self-care kits
- New-mom recovery kits
- Bridesmaid gifts
- Seasonal collections
- Limited-edition collections

---

# 7. E-Commerce Requirements

The platform must support:

## Catalogue

- Products
- Categories
- Collections
- Product variants
- Product images
- Pricing
- Inventory
- Ingredients
- Benefits
- Scent profiles
- Product attributes

## Product Discovery

- Search
- Filtering
- Categories
- Collections
- Recommendations
- Natural-language search
- AI shopping assistant
- Gift finder

## Product Pages

Product pages should communicate:

- Product story
- Product images
- Price
- Variants
- Ingredients
- Benefits
- Scent
- Availability
- Reviews
- Related products
- Complementary products
- Add to cart
- Wishlist
- Sharing

Product pages should feel editorial and premium rather than resembling commodity marketplace listings.

---

# 8. Cart and Checkout

The platform should support:

- Guest checkout
- Customer accounts
- Cart persistence
- Product quantities
- Product variants
- Promo codes
- Gift purchases
- Gift messages
- Shipping
- Payment
- Order confirmation

The checkout experience should be:

- Simple
- Fast
- Mobile-first
- Trustworthy
- Accessible

Do not introduce unnecessary friction.

---

# 9. Payments

The platform must support secure online payments suitable for the South African market.

The payment architecture must support:

- Payment initiation
- Payment verification
- Payment callbacks/webhooks
- Successful payments
- Failed payments
- Pending payments
- Refunds where supported
- Order state transitions

Payment information must be handled securely.

The application should not unnecessarily store sensitive payment information.

---

# 10. Orders

Customers should be able to:

- View orders
- View order details
- See order status
- View shipping information
- Review purchased products

Administrators should be able to:

- View orders
- Search orders
- Filter orders
- Update order status
- Manage fulfilment
- View payment state
- View customer information

---

# 11. Customers

Customer profiles may contain:

- Basic account information
- Addresses
- Orders
- Wishlist
- Preferences
- Product interactions
- Reviews
- Gifting activity

Customer data must be handled according to appropriate privacy and security principles.

---

# 12. AI Experience

AI is a major component of Ndalo Bloom.

The AI should feel like an intelligent personal shopping companion rather than a generic chatbot.

---

# 13. Bloom AI

The primary AI shopping assistant is called:

> **Bloom AI**

Bloom AI should help customers answer:

> "What do I need today?"

Examples:

> "I've had a horrible week and I just want to relax after my toddler goes to bed."

> "I want something calming for Sunday evening."

> "I need a small gift for my sister."

Bloom AI should understand intent and guide customers toward relevant products or experiences.

---

# 14. AI Gift Finder

Customers should be able to describe the person they are buying for.

Example:

> "My best friend is 30, just had a baby, loves feminine things and deserves some time to herself."

The system should recommend relevant products or gift combinations.

The experience should consider:

- Recipient
- Age range
- Occasion
- Relationship
- Preferences
- Mood
- Budget
- Product category
- Personal vs gifting purchase

---

# 15. Personalized Recommendations

Recommendations may consider:

- Products viewed
- Products purchased
- Preferences
- Scent
- Mood
- Occasion
- Category
- Gift intent
- Complementary products
- Frequently bought together

Recommendations should have meaningful explanations.

For example:

> **Complete your unwind ritual**

rather than simply:

> "You may also like."

---

# 16. Natural-Language Search

Customers should be able to search naturally.

Examples:

> "Something relaxing for Sunday evening."

> "A feminine birthday gift under R500."

> "Something for a tired new mom."

The system should translate intent into trustworthy product results.

---

# 17. AI Gift Messages

Customers should be able to generate personalised gift messages.

The experience should allow:

- Generate
- Regenerate
- Edit
- Choose tone
- Final customer approval

The customer must always have control over the final message.

---

# 18. AI Data Integrity

AI must NEVER be the authoritative source of:

- Product price
- Product stock
- Ingredients
- Product specifications
- Shipping cost
- Payment state
- Order state
- Customer account information

AI should retrieve trusted facts from application data.

AI must not invent:

- Ingredients
- Benefits
- Medical claims
- Pricing
- Availability
- Discounts
- Product specifications

The architecture should follow:

```text
Customer
   ↓
AI interprets intent
   ↓
Structured application request
   ↓
Trusted application data
   ↓
AI explains/presents results
   ↓
Customer
```

---

# 19. Your Bloom Ritual

A potential signature Ndalo Bloom experience is:

> **Your Bloom Ritual**

Customers may choose:

- Unwind
- Pamper myself
- Find a gift
- Reset
- Surprise me

The system can generate a personalized ritual.

Example:

### The Exhale

A calming evening ritual containing:

- Recommended products
- Mood
- Duration
- Ritual instructions
- Optional sharing experience

This feature should be evaluated for V1 versus post-launch implementation.

---

# 20. Social-First Product

Ndalo Bloom should be designed to be shared.

Primary social platforms:

- Instagram
- TikTok
- WhatsApp
- Pinterest

Customers should be able to share:

- Products
- Gift ideas
- Bloom Rituals
- Recommendations
- AI-generated ritual cards
- Unboxing moments
- Bloom Moments

---

# 21. Shareable Experiences

Potential social assets include:

- Instagram Story cards
- Instagram posts
- WhatsApp sharing
- Pinterest sharing
- TikTok-friendly links
- Personalized ritual cards
- Gift recommendation cards
- Product cards

The share experience should make the customer feel proud to show Ndalo Bloom.

---

# 22. Packaging and Unboxing

Packaging is part of the product experience.

The goal is for opening a Ndalo Bloom box to feel worth recording.

Potential packaging experience:

- Premium box
- Tissue paper
- Ribbon
- Beautiful product arrangement
- Personalized message
- Brand card
- Ritual card
- Share prompt

The physical experience should connect naturally with the digital experience.

Potential future mechanisms include:

- QR codes
- Personalized landing pages
- Ritual pages
- Reorder links
- UGC prompts

---

# 23. Bloom Moments

Ndalo Bloom should encourage customers to share their experience.

Potential CTA:

> **Show us your Bloom.**

This can eventually support:

- UGC gallery
- Customer photos
- Social proof
- Community
- Campaigns
- Referral programs

---

# 24. Homepage

The homepage should feel editorial and immersive.

Primary hero concept:

> **MAKE TIME FOR YOU.**

Supporting message:

> Luxury rituals for the woman who gives everyone else everything.

Primary CTAs:

> Find Your Ritual

> Shop Ndalo Bloom

The homepage should introduce the emotional value before overwhelming the customer with product listings.

---

# 25. UX Principles

The experience should make customers feel:

- Guided
- Understood
- Inspired
- Excited
- Relaxed
- Confident

Customers should not feel like they are navigating a database.

The experience should help customers:

- Discover something beautiful
- Find something matching their mood
- Give meaningfully
- Create a moment
- Share the experience

---

# 26. Visual Direction

The visual language should be:

- Feminine
- Luxury
- Lush
- Modern
- Editorial
- Warm
- Sensory

Pink is an important brand colour but should not overwhelm the interface.

The design should feel premium without becoming visually noisy.

Avoid:

- Excessive gradients
- Cheap-looking effects
- Overuse of animation
- Generic templates
- Excessive rounded cards
- Clinical wellness aesthetics
- Childlike visuals

---

# 27. Motion

Use motion intentionally.

Potential motion includes:

- Page transitions
- Product image transitions
- Scroll reveals
- Hover states
- Cart transitions
- AI conversation transitions
- Ritual-building animations
- Share-card generation

Motion must never compromise:

- Performance
- Accessibility
- Mobile usability
- Checkout conversion

Support reduced-motion preferences.

---

# 28. Mobile-First

The website must be designed mobile-first.

A significant portion of traffic is expected to come from:

- Instagram
- TikTok
- WhatsApp
- Mobile search

Important experiences must work beautifully on small screens.

---

# 29. Admin

Administrators should be able to manage:

### Products

- Create
- Edit
- Activate/deactivate
- Archive
- Pricing
- Inventory
- Images
- Ingredients
- Benefits
- Scents
- Categories
- Collections

### Orders

- View
- Search
- Filter
- Update status
- Fulfilment
- Payment state

### Customers

- Profiles
- Orders
- Preferences
- Reviews

### Promotions

- Promo codes
- Discounts
- Campaigns
- Start/end dates

### Content

Potentially:

- Homepage content
- Editorial content
- Campaign pages
- Blog content

AI-generated content must require human review before publication where appropriate.

---

# 30. Analytics

Track:

- Product views
- Searches
- AI conversations
- AI recommendations
- Gift Finder usage
- Ritual creation
- Add to cart
- Checkout started
- Purchases
- Social shares
- Wishlist
- Reviews
- Campaign interactions

AI metrics:

- AI usage
- AI-assisted conversion
- Gift Finder conversion
- Recommendation conversion
- Search success
- AI-assisted AOV

Social metrics:

- Share rate
- Social referral traffic
- UGC submissions
- Social-assisted revenue

---

# 31. SEO

The platform must support:

- Product SEO
- Collection SEO
- Dynamic metadata
- Canonical URLs
- Sitemap
- Robots
- Open Graph
- Structured data
- Product schema
- Breadcrumb schema
- SEO-friendly URLs
- Image metadata

Product pages should be independently discoverable and shareable.

---

# 32. Performance

Core principle:

> **Luxury should never mean slow.**

The application should prioritize:

- Optimized images
- Responsive images
- Lazy loading
- Efficient JavaScript
- Code splitting
- Caching
- CDN
- Efficient APIs
- Optimized fonts
- Minimal unnecessary third-party scripts
- Fast AI interactions
- Mobile performance

---

# 33. Accessibility

Support:

- Keyboard navigation
- Screen readers
- Semantic HTML
- Focus states
- Accessible forms
- Appropriate contrast
- Accessible errors
- Reduced motion
- Accessible dialogs
- Accessible product galleries
- Accessible checkout
- Accessible AI interactions

---

# 34. Security

Security requirements include:

- Secure authentication
- Authorization
- Admin permissions
- Session security
- Input validation
- Sanitization
- Rate limiting
- XSS protection
- Secure cookies
- Secrets management
- Payment security
- Webhook verification
- API protection
- Audit logging
- Customer data protection
- Secure file uploads
- AI data isolation

---

# 35. Architecture Principles

The application should be:

- Modular
- Maintainable
- Testable
- Type-safe
- Secure
- Scalable
- Performance-conscious
- Accessibility-conscious
- AI-provider agnostic

Avoid microservices unless there is a compelling reason.

Prefer a well-structured modular application.

---

# 36. AI Provider Independence

The AI layer should be separated from core commerce logic.

The application should be capable of changing AI providers/models without requiring a rewrite of the commerce domain.

---

# 37. Recommendation Philosophy

Start simple.

V1 can use:

- Product relationships
- Categories
- Mood
- Scent
- Occasion
- Complementary products
- Frequently bought together

More advanced AI or machine-learning recommendations should be introduced after sufficient behavioural data exists.

---

# 38. V1

V1 must include:

- Responsive storefront
- Product catalogue
- Product pages
- Search
- Cart
- Checkout
- Payments
- Shipping
- Accounts
- Order management
- Admin products
- AI shopping assistant
- AI gift finder
- Personalized recommendations
- Natural-language search
- AI gift messages
- Social sharing
- SEO
- Analytics
- Performance
- Security
- Accessibility

---

# 39. Shortly After Launch

Potential features:

- Personalized Bloom Rituals
- UGC gallery
- Wishlist
- Customer preferences
- Advanced personalization
- AI social cards
- Loyalty
- Referrals

---

# 40. Future

Potential future capabilities:

- Personalized homepages
- AI self-care plans
- AI customer support
- Review sentiment analysis
- AI merchandising
- AI campaign assistance
- AI SEO assistance
- Personalized email recommendations
- Intelligent bundling
- Predictive recommendations

---

# 41. Success Metrics

## Commerce

- Conversion rate
- Average order value
- Repeat purchase rate
- Cart abandonment
- Customer acquisition cost

## AI

- AI usage
- AI-assisted conversion
- Gift Finder conversion
- Recommendation conversion
- Search success
- AI-assisted AOV

## Social

- Share rate
- Social referral traffic
- UGC submissions
- Social-assisted revenue

## Brand

- Reviews
- Repeat customers
- Email/community growth
- Customer satisfaction

---

# 42. Core Product Philosophy

Ndalo Bloom should make customers feel:

> "I found exactly what I needed."

The website should not simply help customers buy products.

It should help them:

**Discover something beautiful.**

**Find something that fits their mood.**

**Give something meaningful.**

**Create a moment.**

**Want to show someone else.**

---

# 43. Final North Star

Everything should ultimately support:

> **MAKE TIME FOR YOU.**