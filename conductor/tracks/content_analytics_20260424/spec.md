# Track: Content Analytics & Performance Tracking

## Overview
Implement a analytics dashboard that tracks video performance metrics from YouTube, providing insights into content strategy and audience engagement.

## Problem Statement
The system currently publishes videos twice daily but has no mechanism to track performance. Without analytics, there's no feedback loop to understand which movies, trivia types, or video formats perform best.

## Goals
1. Track video views, watch time, and engagement metrics
2. Identify top-performing content categories
3. Provide data-driven insights for movie selection
4. Monitor subscriber growth and audience retention

## Acceptance Criteria
- [ ] YouTube Analytics API integration for video metrics
- [ ] Dashboard showing per-video performance (views, watch time, likes, comments)
- [ ] Aggregated reports by movie genre, trivia type, and publish time
- [ ] Trend analysis showing performance over time
- [ ] Export capability for external analysis

## Technical Notes
- Use YouTube Analytics API v2 (requires OAuth2 from existing YouTube Auto-Publish track)
- Store analytics data locally in SQLite for historical tracking
- Update metrics daily via scheduled job
- Dashboard integrates into existing React UI as new sidebar section