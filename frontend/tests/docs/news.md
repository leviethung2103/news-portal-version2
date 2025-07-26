# News Page Test Cases

## Overview
This document describes the Playwright test cases for the News feature.

## Test Cases

### 1. Displays news grid and cards
- Navigates to `/news`.
- Expects the news grid and at least one news card to be visible.

### 2. Can search/filter news
- Uses the search box to filter news.
- Expects filtered results to match the search term.

### 3. Can open news article
- Clicks on a news card.
- Expects to navigate to the article page and see the article heading.
