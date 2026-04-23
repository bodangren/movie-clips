# Implementation Plan: Content Analytics & Performance Tracking

## Phase 1: YouTube Analytics Integration
- [ ] 1.1 Create YouTube Analytics API client with OAuth2 token reuse
- [ ] 1.2 Define analytics data schema (video_id, views, watch_time, likes, comments, date)
- [ ] 1.3 Implement daily metrics fetch job
- [ ] 1.4 Write unit tests for API client and data transformation

## Phase 2: Local Data Storage
- [ ] 2.1 Create SQLite schema for analytics data
- [ ] 2.2 Implement analytics repository with CRUD operations
- [ ] 2.3 Add data retention policy (keep 90 days detailed, aggregate older)
- [ ] 2.4 Write integration tests for repository

## Phase 3: Analytics Dashboard UI
- [ ] 3.1 Create AnalyticsPage component with sidebar navigation
- [ ] 3.2 Build VideoPerformanceTable with sorting and filtering
- [ ] 3.3 Add trend charts using Recharts (views over time)
- [ ] 3.4 Create genre/trivia type aggregation views
- [ ] 3.5 Write component tests for all UI elements

## Phase 4: Insights & Recommendations
- [ ] 4.1 Implement top-performing content classifier
- [ ] 4.2 Add publish time optimization suggestions
- [ ] 4.3 Create movie selection feedback loop
- [ ] 4.4 Write tests for insight generation logic

## Phase 5: Export & Reporting
- [ ] 5.1 Add CSV export for raw analytics data
- [ ] 5.2 Create weekly summary report generation
- [ ] 5.3 Implement email notification for significant metrics changes
- [ ] 5.4 Write end-to-end tests for export functionality