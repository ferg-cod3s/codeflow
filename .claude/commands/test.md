---
description: Generate comprehensive tests for implemented features, APIs, or code changes. Creates unit tests, integration tests, end-to-end tests, and test documentation.
---

You are tasked with generating comprehensive tests for implemented features, APIs, or code changes.

The user will provide context about what needs to be tested - this could be a recently implemented plan, specific features, API endpoints, or code modules.

## Testing Process

### Step 1: Analyze the Implementation

1. **Read the provided context**:
   - Implementation plan files with success criteria
   - Recently modified code files
   - Feature specifications or tickets
   - Existing test files and patterns

2. **Understand the codebase testing setup**:
   - Use the **codebase-locator** agent to find existing test files and testing frameworks
   - Use the **codebase-pattern-finder** agent to identify testing patterns and conventions
   - Use the **codebase-analyzer** agent to understand the implementation that needs testing
   - Identify test runner configuration (Jest, Vitest, PyTest, etc.)

3. **Create test plan** using TodoWrite to track all testing tasks

### Step 2: Test Strategy Selection

Based on the implementation scope, determine appropriate test types:

#### **Unit Tests**
- **Function/method testing**: Individual functions with various inputs
- **Component testing**: React/Vue components in isolation
- **Module testing**: Individual modules and their exports
- **Edge case testing**: Boundary conditions and error cases

#### **Integration Tests**
- **API endpoint testing**: Request/response testing with real dependencies
- **Database integration**: Testing data persistence and retrieval
- **Service integration**: Testing interactions between services
- **Third-party integration**: External API and service testing

#### **End-to-End Tests**
- **User journey testing**: Complete user workflows
- **Browser automation**: UI testing with Playwright/Cypress
- **API workflow testing**: Multi-step API interactions
- **Cross-browser testing**: Compatibility validation

#### **Performance Tests**
- **Load testing**: Performance under expected load
- **Stress testing**: Breaking point identification
- **Memory testing**: Memory usage and leak detection
- **Response time testing**: API and UI response validation

### Step 3: Test Implementation

Follow these testing best practices:

1. **Test Structure**:
   - Use descriptive test names that explain the scenario
   - Follow AAA pattern: Arrange, Act, Assert
   - Group related tests in describe/context blocks
   - Use consistent file naming conventions

2. **Test Quality**:
   - Test behavior, not implementation details
   - Include positive and negative test cases
   - Test edge cases and error conditions
   - Mock external dependencies appropriately

3. **Test Data Management**:
   - Use factories or fixtures for test data
   - Clean up test data after tests run
   - Avoid hard-coded values in tests
   - Use realistic test data that matches production

### Step 4: Specialized Testing

Use specialized agents when relevant:

- **quality-testing_performance_tester** - For performance testing strategy and k6/JMeter scripts
- **development_accessibility_pro** - For accessibility testing requirements
- **security_scanner** - For security testing considerations
- **development_database_expert** - For database testing patterns
- **development_api_builder** - For API testing standards

### Step 5: Test Categories by Framework

#### **JavaScript/TypeScript (Jest, Vitest)**
```javascript
// Unit test example
describe('UserService', () => {
  test('should create user with valid data', () => {
    // Arrange, Act, Assert
  });
  
  test('should throw error with invalid email', () => {
    // Error case testing
  });
});
```

#### **React Testing (React Testing Library)**
```javascript
// Component test example
test('LoginForm submits with correct data', () => {
  render(<LoginForm onSubmit={mockSubmit} />);
  // User interaction testing
});
```

#### **API Testing (Supertest, REST Client)**
```javascript
// Integration test example
describe('POST /api/users', () => {
  test('should create user and return 201', async () => {
    // API endpoint testing
  });
});
```

#### **Python (PyTest)**
```python
# Unit test example
def test_user_creation_valid_data():
    """Test user creation with valid data"""
    # Test implementation
    
def test_user_creation_invalid_email():
    """Test user creation fails with invalid email"""
    # Error case testing
```

#### **E2E Testing (Playwright, Cypress)**
```javascript
// E2E test example
test('user can complete registration flow', async ({ page }) => {
  // Complete user journey testing
});
```

### Step 6: Test Configuration

Ensure proper test setup:

1. **Test Environment**:
   - Configure test database/environment
   - Set up test-specific environment variables
   - Configure mock services and dependencies
   - Ensure test isolation

2. **Coverage Requirements**:
   - Set appropriate coverage thresholds
   - Ensure critical paths have high coverage
   - Exclude non-critical files from coverage
   - Generate coverage reports

3. **CI/CD Integration**:
   - Configure tests to run in CI/CD pipeline
   - Set up parallel test execution
   - Configure test result reporting
   - Set up failure notifications

### Step 7: Test Documentation

Create supporting test documentation:

- **Test strategy document**: Overview of testing approach
- **Test setup instructions**: How to run tests locally
- **Test data management**: How to create and manage test data
- **Troubleshooting guide**: Common test issues and solutions

## Success Criteria

Testing is complete when:
- ✅ All new functionality has appropriate unit tests
- ✅ Integration points are tested with integration tests
- ✅ Critical user journeys have E2E tests
- ✅ Error cases and edge conditions are tested
- ✅ Performance requirements are validated
- ✅ Tests pass consistently in CI/CD pipeline
- ✅ Code coverage meets project standards
- ✅ Tests are maintainable and well-documented

## Test Quality Guidelines

1. **Fast Feedback**: Unit tests should run quickly
2. **Reliable**: Tests should be deterministic and not flaky
3. **Maintainable**: Tests should be easy to update when code changes
4. **Readable**: Test names and structure should be clear
5. **Isolated**: Tests shouldn't depend on each other
6. **Realistic**: Test scenarios should match real-world usage

What needs to be tested: $ARGUMENTS