# Vision Board Page Test Cases

## Overview
This document describes the Playwright test cases for the Vision Board feature.

## Test Cases

### 1. Displays vision items and progress overview
- Navigates to `/vision-board`.
- Expects the main heading, description, and progress overview to be visible.

### 2. Can add a new vision item
- Opens the add dialog.
- Fills in all required fields.
- Submits the form.
- Expects the new item to appear in the list.

### 3. Can filter by category
- Uses the category filter to select a specific category.
- Expects only items from that category to be shown.

### 4. Can mark item as complete/incomplete
- Marks an item as complete.
- Expects the button to toggle to "Mark as Incomplete".

### 5. Shows empty state when no items match filter
- Applies a filter that yields no results.
- Expects the empty state message to be shown.
