# Frontend Testing Strategy

## Overview

This document outlines the testing strategy for the Next.js frontend application. The goal is to ensure the reliability of UI components and user interactions through automated tests.

## Test Scope

We will focus on **Component Testing** to verify the behavior of individual UI units in isolation.

- **LoginForm**: Verify input validation, form submission handling, and API calls (mocked).
- **ChatRoom / ChatMessage**: Verify message rendering, styling based on user (self/others), and interaction with mocked WebSocket events.

## Tech Stack

- **Test Runner**: `Jest`
- **Environment**: `jest-environment-jsdom` (simulates browser environment)
- **Testing Utilities**:
  - `@testing-library/react`: For rendering components and querying the DOM.
  - `@testing-library/user-event`: For simulating user interactions (clicks, typing).
  - `@testing-library/jest-dom`: For custom DOM element matchers.

## Mocking Strategy

External dependencies will be mocked to ensure tests are fast and deterministic.

- **next/navigation**: `useRouter` will be mocked to verify navigation calls without actual routing.
- **API Calls (Axios)**: API requests will be intercepted and mocked to return controlled responses.
- **Socket.io**: WebSocket connections will be mocked to simulate server events and verify client emissions.

## Directory Structure

Tests will be co-located with components or placed in a `__tests__` directory, or follow the pattern `*.test.tsx`. For this phase, we will place them alongside the components or in a mirrored structure if preferred.

## Configuration

- `jest.config.ts`: Jest configuration for Next.js + TypeScript.
- `jest.setup.ts`: Global setup, including mocks and test environment extensions.
