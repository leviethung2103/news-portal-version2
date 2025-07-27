---
mode: agent
---
Define the task to achieve, including specific requirements, constraints, and success criteria.
- Create or update Playwright test cases for the pages you found in the project

# Workflow
- Identify the page.tsx, components, logics belong to that pages
- Read careful the features of each page. Identify the new of updated features.
- Analyze and remember each components in page, especially the buttons, etc.
- Ensure each test case follows the structure of "Displays [element]" or "Can [action]".
- Include navigation to the respective page before each test case.
- Use the Playwright testing framework and ensure the tests are runnable.
- Each test case should check for visibility of key elements on the page.
- Ensure the test cases are clear and concise, following best practices for Playwright tests.
- Create reports for each test case to verify the functionality of the pages.
- Test results will be saved in folder frontend/tests/reports.
- Ensure that the test cases are compatible with the existing project structure and naming conventions.
- Report in the markdown format, similar to the existing test case documents.


# Setup Testing

```bash
cd ~/Downloads/news-portal-dashboard/frontend
npx playwright test
```

Finally, say user can check the report by 
```bash
npx playwright show-report tests/reports
```