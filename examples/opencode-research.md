---
name: research
mode: command
scope: both
depth: deep
model: anthropic/claude-sonnet-4
temperature: 0.1
inputs:
  topic:
    type: string
    description: Research topic or question
    required: true
  scope:
    type: string
    description: Search scope (file pattern or directory)
    default: 'src/**/*'
  pattern:
    type: string
    description: Search pattern or regex
    default: ''
  include-tests:
    type: boolean
    description: Include test files in research
    default: false
  include-docs:
    type: boolean
    description: Include documentation files
    default: true
  max-results:
    type: number
    description: Maximum number of results to analyze
    default: 50
outputs:
  findings:
    type: object
    description: Research findings and insights
  recommendations:
    type: array
    description: Actionable recommendations
  file-list:
    type: array
    description: List of relevant files found
---

# Research Analysis

## Research Parameters

**Topic:** {{topic}}  
**Scope:** {{scope}}  
**Pattern:** {{pattern}}  
**Include Tests:** {{include-tests}}  
**Include Docs:** {{include-docs}}  
**Max Results:** {{max-results}}

## Research Strategy

### Phase 1: Codebase Discovery

1. **Locate Relevant Files**
   - Search for files matching pattern: `{{pattern}}`
   - Filter by scope: `{{scope}}`
   - Include test files: {{include-tests}}
   - Include documentation: {{include-docs}}

2. **Analyze File Contents**
   - Extract key implementations
   - Identify patterns and conventions
   - Document dependencies and relationships

### Phase 2: Pattern Analysis

1. **Implementation Patterns**
   - Common coding patterns found
   - Architectural decisions
   - Best practices in use

2. **Gap Analysis**
   - Missing implementations
   - Inconsistent patterns
   - Areas for improvement

### Phase 3: Documentation Review

1. **Existing Documentation**
   - API documentation
   - Architecture docs
   - README files
   - Code comments

2. **Knowledge Gaps**
   - Undocumented features
   - Missing examples
   - Outdated information

## Execution Plan

### Step 1: File Discovery

```bash
# Find relevant files
find {{scope}} -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -{{max-results}}

# Search for specific patterns
rg "{{pattern}}" {{scope}} --type ts --type tsx -A 3 -B 3
```

### Step 2: Content Analysis

```bash
# Analyze imports and dependencies
rg "import.*from" {{scope}} --type ts --type tsx | sort | uniq -c | sort -nr

# Find function definitions
rg "function|const.*=.*\(|class" {{scope}} --type ts --type tsx
```

### Step 3: Documentation Search

```bash
# Find documentation files
find . -name "*.md" -o -name "*.rst" -o -name "*.txt" | grep -E "(README|docs?|documentation)"

# Search for TODO/FIXME comments
rg "TODO|FIXME|XXX|HACK" {{scope}} --type ts --type tsx
```

## Research Questions to Answer

1. **Current Implementation**
   - How is {{topic}} currently implemented?
   - What files are involved?
   - What patterns are used?

2. **Code Quality**
   - Are there consistent coding standards?
   - Is there proper error handling?
   - Are tests comprehensive?

3. **Architecture**
   - How does {{topic}} fit into the overall architecture?
   - What are the dependencies?
   - Are there architectural concerns?

4. **Documentation**
   - Is {{topic}} well documented?
   - Are there examples and guides?
   - Is the documentation up to date?

## Expected Deliverables

### 1. File Inventory

- List of all relevant files
- File purposes and responsibilities
- Inter-file dependencies

### 2. Implementation Analysis

- Current implementation details
- Code patterns and conventions
- Strengths and weaknesses

### 3. Recommendations

- Improvement suggestions
- Best practice recommendations
- Refactoring opportunities

### 4. Documentation Updates

- Missing documentation to create
- Outdated information to update
- Examples and tutorials needed

## Analysis Framework

### Code Quality Metrics

- **Complexity**: Cyclomatic complexity of functions
- **Coverage**: Test coverage percentage
- **Consistency**: Coding standard adherence
- **Maintainability**: Code readability and structure

### Architecture Assessment

- **Separation of Concerns**: Proper layering and boundaries
- **Dependencies**: Manageable dependency graph
- **Scalability**: Ability to handle growth
- **Performance**: Efficiency considerations

### Documentation Quality

- **Completeness**: All aspects documented
- **Accuracy**: Documentation matches implementation
- **Accessibility**: Easy to find and understand
- **Examples**: Practical usage examples

## Next Steps

1. **Execute Research**
   - Run file discovery commands
   - Analyze found files
   - Document findings

2. **Synthesize Results**
   - Compile analysis into structured report
   - Identify key insights
   - Create actionable recommendations

3. **Present Findings**
   - Share research results
   - Discuss recommendations
   - Plan implementation of improvements

## Output Format

The research will produce:

```json
{
  "topic": "{{topic}}",
  "scope": "{{scope}}",
  "files_analyzed": number,
  "findings": {
    "current_implementation": string,
    "patterns_used": array,
    "code_quality": object,
    "architecture": object
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "description": string,
      "effort": "low|medium|high",
      "impact": "low|medium|high"
    }
  ],
  "documentation_gaps": array,
  "next_steps": array
}
```

---

**Research initiated for:** {{topic}}  
**Scope:** {{scope}}  
**Timestamp:** {{current-date}}  
**Max Results:** {{max-results}}
