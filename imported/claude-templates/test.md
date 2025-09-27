---
name: test
description: Run Python tests with pytest, unittest, or other testing frameworks.
mode: command
model: opencode/grok-code
temperature: 0.7
category: template
tags: ["template","claude","commands"]
x-claude:
  original_name: "test"
  import_source: "claude-templates"
  import_path: ".claude/commands/test.md"
  import_date: "2025-09-27T03:25:37.456Z"
  original_model: "unknown"
---

# test (Imported Template)

Run Python tests with pytest, unittest, or other testing frameworks.

## Original Prompt

# Test Runner

Run Python tests with pytest, unittest, or other testing frameworks.

## Purpose

This command helps you run Python tests effectively with proper configuration and reporting.

## Usage

```
/test
```

## What this command does

1. **Detects test framework** (pytest, unittest, nose2)
2. **Runs appropriate tests** with proper configuration
3. **Provides coverage reporting** if available
4. **Shows clear test results** with failure details

## Example Commands

### pytest (recommended)
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_models.py

# Run with verbose output
pytest -v

# Run tests matching pattern
pytest -k "test_user"
```

### unittest
```bash
# Run all tests
python -m unittest discover

# Run specific test file
python -m unittest tests.test_models

# Run with verbose output
python -m unittest -v
```

### Django tests
```bash
# Run all Django tests
python manage.py test

# Run specific app tests
python manage.py test myapp

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## Best Practices

- Write tests for all critical functionality
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies
- Aim for high test coverage (80%+)





## Metadata

- **Source**: [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates)
- **Original Path**: .claude/commands/test.md
- **License**: Apache-2.0
- **Attribution**: davila7
- **Import Date**: 2025-09-27T03:25:37.456Z

## Usage

This template was imported from the Claude Templates collection. It's designed to work with Claude AI and can be used for:

- Use this template as configured in Claude
- Customize the prompt and instructions as needed

## Original Configuration

```yaml
content: >-
  # Test Runner


  Run Python tests with pytest, unittest, or other testing frameworks.


  ## Purpose


  This command helps you run Python tests effectively with proper configuration
  and reporting.


  ## Usage


  ```

  /test

  ```


  ## What this command does


  1. **Detects test framework** (pytest, unittest, nose2)

  2. **Runs appropriate tests** with proper configuration

  3. **Provides coverage reporting** if available

  4. **Shows clear test results** with failure details


  ## Example Commands


  ### pytest (recommended)

  ```bash

  # Run all tests

  pytest


  # Run with coverage

  pytest --cov=src --cov-report=html


  # Run specific test file

  pytest tests/test_models.py


  # Run with verbose output

  pytest -v


  # Run tests matching pattern

  pytest -k "test_user"

  ```


  ### unittest

  ```bash

  # Run all tests

  python -m unittest discover


  # Run specific test file

  python -m unittest tests.test_models


  # Run with verbose output

  python -m unittest -v

  ```


  ### Django tests

  ```bash

  # Run all Django tests

  python manage.py test


  # Run specific app tests

  python manage.py test myapp


  # Run with coverage

  coverage run --source='.' manage.py test

  coverage report

  ```


  ## Best Practices


  - Write tests for all critical functionality

  - Use descriptive test names

  - Keep tests isolated and independent

  - Mock external dependencies

  - Aim for high test coverage (80%+)

```
