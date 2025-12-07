# AI-Powered Deck Creation

## Overview

This document outlines the implementation plan for AI-powered deck and flashcard creation using OpenAI's API. The system will allow users to create, edit, and manage flashcard decks using natural language commands.

## Features

### Core Capabilities
- **Create decks from prompts**: "Create a deck with the capitals of South America"
- **Add cards to existing decks**: "Add the capitals of Central America"
- **Generate learning content**: "Create a deck to learn the presidents of the USA"
- **Spaced repetition optimization**: Cards optimized for SRS learning

### User Experience
- Natural language input in Creation Studio
- Real-time card preview before saving
- Edit generated cards before committing
- Batch operations for efficiency

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Creation Studio │  │   AI Chat UI    │  │  Card Preview   │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    /api/ai/generate                          ││
│  │  - POST: Generate deck/cards from prompt                     ││
│  │  - Streaming response for real-time updates                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI Module                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   OpenAI     │  │   Prompts    │  │     MCP Tools          │ │
│  │   Client     │  │   Library    │  │  (Deck/Card Schema)    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Decks     │  │    Cards     │  │   Card FSRS  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Infrastructure Setup

#### 1.1 GitHub Actions Update
- [ ] Add `OPENAI_API_KEY` secret to GitHub repository
- [ ] Update `docker-compose.yml` to pass the secret
- [ ] Update GitHub Actions workflow to include the secret

#### 1.2 Environment Configuration
- [ ] Add `OPENAI_API_KEY` to environment variables
- [ ] Create `.env.example` with placeholder

---

### Phase 2: AI Module

#### 2.1 Directory Structure
```
app/src/lib/ai/
├── index.ts              # Main exports
├── openai.ts             # OpenAI client configuration
├── prompts/              # Prompt templates
│   ├── index.ts          # Prompt exports
│   ├── deck-creation.ts  # Deck creation prompts
│   ├── card-generation.ts # Card generation prompts
│   └── system.ts         # System prompts with SRS context
└── mcp/                  # Model Context Protocol tools
    ├── index.ts          # MCP exports
    ├── schemas.ts        # Zod schemas for deck/card
    └── tools.ts          # Tool definitions for OpenAI
```

#### 2.2 OpenAI Client (`openai.ts`)
```typescript
// Configuration and client initialization
// - API key from environment
// - Default model (gpt-4o-mini for cost efficiency)
// - Retry logic and error handling
```

#### 2.3 MCP Tools (`mcp/tools.ts`)
Define structured output tools for OpenAI function calling:

```typescript
// Tool: create_deck
// - name: string (required)
// - description: string
// - category: DeckCategory
// - cards: Card[]

// Tool: add_cards
// - deck_id: string (required)
// - cards: Card[]

// Tool: update_card
// - card_id: string (required)
// - front: string
// - back: string

// Card Schema:
// - front: string (question/prompt)
// - back: string (answer)
// - tags: string[] (optional)
// - difficulty_hint: 'easy' | 'medium' | 'hard' (optional)
```

---

### Phase 3: Prompts Library

#### 3.1 System Prompt (`prompts/system.ts`)
Core instructions for the AI including:
- Spaced repetition context and best practices
- Card formatting guidelines
- Difficulty calibration
- Content optimization for memory retention

#### 3.2 Deck Creation Prompt (`prompts/deck-creation.ts`)
Templates for creating new decks with:
- Subject matter extraction
- Category inference
- Card count optimization
- Progressive difficulty

#### 3.3 Card Generation Prompt (`prompts/card-generation.ts`)
Templates for generating individual cards:
- Question formulation
- Answer conciseness
- Mnemonic suggestions
- Related concepts linking

---

### Phase 4: API Routes

#### 4.1 Generate Endpoint (`/api/ai/generate`)
```typescript
POST /api/ai/generate
{
  "prompt": "Create a deck with capitals of South America",
  "deck_id": null,  // null for new deck, string to add to existing
  "options": {
    "card_count": 10,  // optional, AI decides if not specified
    "category": "geography"  // optional
  }
}

Response (streaming):
{
  "type": "deck" | "cards",
  "deck": { name, description, category },
  "cards": [{ front, back, tags }],
  "message": "Generated 12 flashcards for South American capitals"
}
```

---

### Phase 5: Frontend Integration

#### 5.1 AI Chat Component
- Text input for natural language commands
- Streaming response display
- Card preview grid
- Edit before save functionality

#### 5.2 Creation Studio Enhancement
- Add AI generation tab/mode
- Integrate with existing deck creation flow
- Support adding AI cards to existing decks

---

## Spaced Repetition Optimization

The AI will be instructed to create cards optimized for spaced repetition learning:

### Card Design Principles
1. **Atomic**: One concept per card
2. **Clear**: Unambiguous questions and answers
3. **Concise**: Brief but complete answers
4. **Connected**: Link to prior knowledge when possible

### Difficulty Calibration
- **Easy**: Basic facts, single-word answers
- **Medium**: Requires understanding, short explanations
- **Hard**: Application, synthesis, or complex recall

### Memory Optimization
- Use active recall prompts ("What is..." vs "X is...")
- Include context cues when helpful
- Avoid ambiguous questions
- Support visual memory with formatting

---

## Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Cost-effective default
OPENAI_MAX_TOKENS=4096
```

---

## Security Considerations

1. **API Key Protection**
   - Never expose in client-side code
   - Use server-side API routes only
   - Rotate keys periodically

2. **Rate Limiting**
   - Implement per-user rate limits
   - Track usage for cost management

3. **Input Validation**
   - Sanitize user prompts
   - Validate generated content before saving

---

## Cost Estimation

Using GPT-4o-mini pricing (~$0.15/1M input, ~$0.60/1M output):
- Average deck creation: ~1000 tokens = ~$0.0006
- 1000 deck creations/month ≈ $0.60

---

## File Changes Required

### New Files
- `app/src/lib/ai/index.ts`
- `app/src/lib/ai/openai.ts`
- `app/src/lib/ai/prompts/index.ts`
- `app/src/lib/ai/prompts/system.ts`
- `app/src/lib/ai/prompts/deck-creation.ts`
- `app/src/lib/ai/prompts/card-generation.ts`
- `app/src/lib/ai/mcp/index.ts`
- `app/src/lib/ai/mcp/schemas.ts`
- `app/src/lib/ai/mcp/tools.ts`
- `app/src/app/api/ai/generate/route.ts`

### Modified Files
- `docker-compose.yml` - Add OPENAI_API_KEY env
- `.github/workflows/deploy.yml` - Add secret
- `app/src/app/(dashboard)/create/page.tsx` - Add AI tab

---

## Testing Strategy

1. **Unit Tests**
   - Prompt template generation
   - Schema validation
   - Tool parsing

2. **Integration Tests**
   - OpenAI API mocking
   - End-to-end deck creation

3. **Manual Testing**
   - Various prompt types
   - Edge cases (empty responses, errors)
   - Rate limit handling

---

## Progress Tracking

- [x] Phase 1: Infrastructure Setup
  - [x] Docker environment (OPENAI_API_KEY in docker-compose.yml)
  - [x] Package dependencies (openai, zod)
- [x] Phase 2: AI Module
  - [x] OpenAI client (src/lib/ai/openai.ts)
  - [x] MCP tools/schemas (src/lib/ai/mcp/)
- [x] Phase 3: Prompts Library
  - [x] System prompts with SRS context (src/lib/ai/prompts/system.ts)
  - [x] Deck/card templates (src/lib/ai/prompts/templates.ts)
- [x] Phase 4: API Routes
  - [x] Generate endpoint (POST /api/ai/generate)
  - [x] Status check endpoint (GET /api/ai/generate)
- [x] Phase 5: Frontend
  - [x] useAI hook (src/hooks/useAI.ts)
  - [x] AIGenerateModal component
  - [x] DeckManager integration

## Setup Instructions

1. Add `OPENAI_API_KEY` to your GitHub repository secrets under `BACKEND_SECRETS` JSON:
   ```json
   {
     "JWT_SECRET": "your-jwt-secret",
     "OPENAI_API_KEY": "sk-your-openai-key"
   }
   ```

2. The deployment will automatically include the key in the container environment.
