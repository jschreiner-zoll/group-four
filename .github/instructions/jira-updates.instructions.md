---
name: jira-updates
description: "Use when updating or editing Jira issues in the ZPM project. Follow these guidelines for consistent, clear issue descriptions and titles."
applyTo: "**"
---

# Jira Issue Update Guidelines

When updating Jira issues (titles, descriptions, or other fields), follow these standards to ensure clarity and consistency.

## Title Formatting

- **Be specific and descriptive** — Use clear language that indicates the scope of work
- **Update names when requirements change** — If the issue evolves, update the title to reflect current understanding
- Examples of good titles:
  - "Toggle from Antiquity to Phoenix"
  - "First Time Experience for Antiquity"
  - "Friction Experience on Toggle"

## Description Structure

### General Principles
- **Lead with the high-level goal** — Start with what users need or what problem you're solving
- **Use bullet points for details** — Makes requirements scannable and clear
- **Include context** — Explain why this matters, not just what to build
- **Be specific about behavior** — Action items should be concrete and testable

### Format

**Opening statement (optional):** High-level context or goal explaining the situation.

**Bullet list:** Specific requirements, user journeys, constraints, and acceptance criteria.
- Lead with the main concept
- Use sub-bullets if needed for clarity
- Use **bold** for app names (Phoenix, Antiquity), critical decisions, or important user actions
- Show user journeys with arrows: `Antiquity → Phoenix`
- For bi-directional flows, note: "This applies in both directions: A → B and B → A"

### Example: Navigation Behavior

```
When a user toggles between the two applications, they will be taken to the top level 
of the destination app's navigation — any work in progress will not carry over.

* We need to design a friction experience that warns users before they toggle
* The message should clearly communicate that toggling will take them to the top of 
  the navigation in the other application
* Users should be advised to finish or save any work in progress before switching applications
* This friction experience applies in both directions: Antiquity → Phoenix and Phoenix → Antiquity
```

### Example: First Time Experience

```
When a user logs in for the first time after the new design is released, 
we need to present a first time login experience that:

* Informs the user that the new design is now available
* Prompts and directs the user to update their **Notification Methods**
* Prompts and directs the user to update their **Notification Settings**
```

## Formatting Guidelines

- Use **bold** for:
  - App names: **Phoenix**, **Antiquity**
  - User actions or critical behaviors
  - Important constraints or system limitations
- Use arrows for user flows: `Source → Destination`
- Keep bullet points concise but complete
- If a point is complex, use a sub-bullet or clarify in the next point
- Avoid jargon; use language developers and designers can act on

## Update Checklist

Before finalizing a Jira issue update:

- [ ] Title is specific and reflects the current scope
- [ ] Description opens with context or goal (if needed)
- [ ] Requirements use bullet format
- [ ] Bold text highlights app names, critical items, or decisions
- [ ] User journeys shown with arrows (e.g., Antiquity → Phoenix)
- [ ] Bi-directional flows explicitly noted
- [ ] Acceptance criteria are testable and clear
- [ ] No unnecessary jargon or ambiguous language

## What NOT to Do

- ❌ Don't use opening paragraphs without bullets — use bullets for all requirements
- ❌ Don't use plain text for app names — always use **Phoenix** or **Antiquity**
- ❌ Don't create complex nested structures — keep it readable with 1-2 levels
- ❌ Don't leave titles vague when they could be more specific
- ❌ Don't use inconsistent capitalization for system names

