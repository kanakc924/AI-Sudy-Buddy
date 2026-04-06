# AI Study Buddy - Missing Features Task List

This list contains features and requirements outlined in the [PRD.md](file:///c:/Users/Kanak/Documents/AI-Sudy-Buddy/PRD.md) that are currently missing, partially implemented, or require refinement to meet the technical specifications.

## 1. Dashboard & Analytics
- [x] **Weak Topics List**: Render the `weakTopics` list in the Dashboard.
- [x] **AI usage indicator in Sidebar**: Move or duplicate the AI usage progress bar to the Sidebar.
- [ ] **Study Session Logging**: Implement the "Got it / Missed it" backend logic.

## 2. AI Content Management
- [x] **Regenerate Confirmation**: Add an `AlertDialog` to the "Regenerate" button.
- [ ] **Empty State Guidance**: Add a "Quick Start" guide or tooltips.

## 3. Backend & Security
- [ ] **Comprehensive Zod Validation**: Apply Zod schema validation to API routes.
- [/] **File Size Enforcement**: Explicitly check for 5MB limit in upload routes.
- [ ] **Rate Limit Headers**: Return `X-RateLimit-Remaining` headers in API responses to inform the frontend usage indicators.

## 4. UI/UX Refinements
- [ ] **JWT Invalidation**: Ensure that the client-side `logout` function clears the cookie or localStorage and effectively prevents any stale token usage (verify `lib/auth.ts` vs the client call).
- [ ] **Mobile Touch Optimization**: Ensure flashcard "flip" animations are fully reliable on mobile touch events (currently uses `onClick`).
- [ ] **Skeleton Loaders**: Implement skeleton loaders for the Study History and Activity Heatmap while data is fetching.
