# Article Page Test Cases

## Overview
This document describes the Playwright test cases for the Article feature.

## Test Cases

### 1. Displays article content
- Navigates to `/article/[id]`.
- Expects the article heading and metadata (author, date, etc.) to be visible.

### 2. Handles non-existent article gracefully
- Navigates to a non-existent article id.
- Expects a not found or error message to be shown.
