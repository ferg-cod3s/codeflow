---
name: context7-documentation-research
description: Research and retrieve comprehensive library documentation using
  Context7's powerful API documentation system. Enables deep exploration of any
  library's API, examples, and implementation patterns.
noReply: true
prompt: >-
  # Context7 Documentation Research Skill


  This skill provides comprehensive library documentation research capabilities
  using Context7's powerful API documentation system. It enables deep
  exploration of any library's API, examples, and implementation patterns with
  intelligent library resolution.


  ## When to Use This Skill


  Use this skill when you need to:


  - Research unfamiliar libraries and their APIs

  - Find comprehensive documentation for specific library features

  - Explore implementation patterns and examples

  - Compare different libraries or approaches

  - Understand library capabilities and limitations

  - Get up-to-date documentation for modern frameworks


  ## Documentation Research Workflow


  ### 1. Library Resolution


  - Accept library names, package names, or partial identifiers

  - Use Context7's intelligent library resolution system

  - Handle multiple matches with relevance scoring

  - Select most appropriate library based on description and trust score


  ### 2. Documentation Retrieval


  - Fetch comprehensive documentation with configurable token limits

  - Focus on specific topics or features when needed

  - Access structured API documentation and examples

  - Retrieve code snippets and implementation patterns


  ### 3. Analysis & Synthesis


  - Analyze documentation for key concepts and patterns

  - Extract relevant examples and use cases

  - Identify best practices and common pitfalls

  - Synthesize findings into actionable insights


  ## Key Context7 Tools Used


  - **Context7_resolve_library_id**: Resolve package names to
  Context7-compatible library IDs

  - **Context7_get_library_docs**: Fetch comprehensive documentation for
  specific libraries


  ## Library Resolution Strategy


  The skill uses Context7's intelligent resolution system:


  1. **Name Analysis**: Parse library names and package identifiers

  2. **Relevance Matching**: Score matches by name similarity, description
  relevance, and documentation coverage

  3. **Trust Assessment**: Prioritize libraries with higher trust scores (7-10)

  4. **Conflict Resolution**: Handle multiple good matches with detailed
  explanations


  ## Research Capabilities


  ### API Documentation


  - Complete API reference with parameters and return types

  - Method signatures and function documentation

  - Class hierarchies and inheritance patterns

  - Interface definitions and implementation requirements


  ### Implementation Examples


  - Code snippets and usage examples

  - Best practices and common patterns

  - Integration examples with popular frameworks

  - Performance considerations and optimization tips


  ### Comparative Analysis


  - Compare multiple libraries or approaches

  - Identify strengths and weaknesses of different solutions

  - Recommend appropriate libraries for specific use cases

  - Highlight compatibility and ecosystem considerations


  ## Best Practices


  - **Specific Queries**: Provide detailed descriptions for better library
  resolution

  - **Topic Focus**: Use specific topics to focus documentation retrieval

  - **Iterative Research**: Start broad, then narrow down to specific features

  - **Example Validation**: Test code examples in your specific context


  ## Example Usage Scenarios


  1. **Framework Research**: "Research React hooks documentation for state
  management"

  2. **Library Comparison**: "Compare axios vs fetch for HTTP requests"

  3. **API Exploration**: "Get comprehensive documentation for lodash array
  methods"

  4. **Integration Patterns**: "Find examples of integrating TypeScript with
  Express.js"

  5. **Modern Features**: "Research latest ES2023 features and browser support"


  ## Integration with CodeFlow Agents


  This skill enhances CodeFlow's development agents:


  - **full-stack-developer**: For framework and library research

  - **api-builder-enhanced**: For API design and documentation patterns

  - **tutorial-engineer**: For creating educational content

  - **codebase-pattern-finder**: For discovering implementation patterns


  ## Notes


  - Requires internet connectivity for Context7 API access

  - Handles library name variations and partial matches

  - Provides structured, searchable documentation output

  - Uses noReply message insertion for persistent reference material
---

# Context7 Documentation Research Skill

This skill provides comprehensive library documentation research capabilities using Context7's powerful API documentation system. It enables deep exploration of any library's API, examples, and implementation patterns with intelligent library resolution.

## When to Use This Skill

Use this skill when you need to:

- Research unfamiliar libraries and their APIs
- Find comprehensive documentation for specific library features
- Explore implementation patterns and examples
- Compare different libraries or approaches
- Understand library capabilities and limitations
- Get up-to-date documentation for modern frameworks

## Documentation Research Workflow

### 1. Library Resolution

- Accept library names, package names, or partial identifiers
- Use Context7's intelligent library resolution system
- Handle multiple matches with relevance scoring
- Select most appropriate library based on description and trust score

### 2. Documentation Retrieval

- Fetch comprehensive documentation with configurable token limits
- Focus on specific topics or features when needed
- Access structured API documentation and examples
- Retrieve code snippets and implementation patterns

### 3. Analysis & Synthesis

- Analyze documentation for key concepts and patterns
- Extract relevant examples and use cases
- Identify best practices and common pitfalls
- Synthesize findings into actionable insights

## Key Context7 Tools Used

- **Context7_resolve_library_id**: Resolve package names to Context7-compatible library IDs
- **Context7_get_library_docs**: Fetch comprehensive documentation for specific libraries

## Library Resolution Strategy

The skill uses Context7's intelligent resolution system:

1. **Name Analysis**: Parse library names and package identifiers
2. **Relevance Matching**: Score matches by name similarity, description relevance, and documentation coverage
3. **Trust Assessment**: Prioritize libraries with higher trust scores (7-10)
4. **Conflict Resolution**: Handle multiple good matches with detailed explanations

## Research Capabilities

### API Documentation

- Complete API reference with parameters and return types
- Method signatures and function documentation
- Class hierarchies and inheritance patterns
- Interface definitions and implementation requirements

### Implementation Examples

- Code snippets and usage examples
- Best practices and common patterns
- Integration examples with popular frameworks
- Performance considerations and optimization tips

### Comparative Analysis

- Compare multiple libraries or approaches
- Identify strengths and weaknesses of different solutions
- Recommend appropriate libraries for specific use cases
- Highlight compatibility and ecosystem considerations

## Best Practices

- **Specific Queries**: Provide detailed descriptions for better library resolution
- **Topic Focus**: Use specific topics to focus documentation retrieval
- **Iterative Research**: Start broad, then narrow down to specific features
- **Example Validation**: Test code examples in your specific context

## Example Usage Scenarios

1. **Framework Research**: "Research React hooks documentation for state management"
2. **Library Comparison**: "Compare axios vs fetch for HTTP requests"
3. **API Exploration**: "Get comprehensive documentation for lodash array methods"
4. **Integration Patterns**: "Find examples of integrating TypeScript with Express.js"
5. **Modern Features**: "Research latest ES2023 features and browser support"

## Integration with CodeFlow Agents

This skill enhances CodeFlow's development agents:

- **full-stack-developer**: For framework and library research
- **api-builder-enhanced**: For API design and documentation patterns
- **tutorial-engineer**: For creating educational content
- **codebase-pattern-finder**: For discovering implementation patterns

## Notes

- Requires internet connectivity for Context7 API access
- Handles library name variations and partial matches
- Provides structured, searchable documentation output
- Uses noReply message insertion for persistent reference material
