# Login Page Test Cases

## Overview
This document describes the Playwright test cases for the Login feature.

## Test Cases

### 1. Displays login form
- Navigates to `/login`.
- Expects email and password fields and login button to be visible.

### 2. Shows error on invalid credentials
- Fills in invalid credentials.
- Expects an error message to be shown.

### 3. Allows successful login
- Fills in valid credentials.
- Expects to be redirected to the dashboard or home page.
