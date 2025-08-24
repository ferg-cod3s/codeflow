---
description: Generate comprehensive documentation for implemented features, APIs, or code changes. Creates user guides, technical documentation, API docs, and inline code comments.
agent: documentation
model: github-copilot/gpt-5
---

You are tasked with generating comprehensive documentation for implemented features, APIs, or code changes.

The user will provide context about what needs to be documented - this could be a recently implemented plan, specific features, API endpoints, or code modules.

## Documentation Process

### Step 1: Understand the Implementation

1. **Read the provided context**:
   - Implementation plan files
   - Recently modified code files  
   - Feature specifications or tickets
   - Any existing documentation that needs updating

2. **Analyze the codebase**:
   - Use the **codebase-locator** agent to find all relevant files
   - Use the **codebase-analyzer** agent to understand the implementation details
   - Identify API endpoints, data models, configuration, and user-facing features

3. **Create documentation plan** to track all documentation tasks

### Step 2: Generate Documentation Types

Based on the implementation scope, create appropriate documentation:

#### **User Documentation**
- **User guides**: Step-by-step instructions for end users
- **Feature documentation**: How to use new features
- **Configuration guides**: Setup and configuration instructions
- **FAQ sections**: Common questions and troubleshooting

#### **Developer Documentation**  
- **API documentation**: Endpoints, parameters, responses, examples
- **Architecture documentation**: System design and component interactions
- **Integration guides**: How to integrate with the feature
- **Development setup**: Environment setup and development workflows

#### **Code Documentation**
- **Inline comments**: Complex logic explanation
- **Function/method documentation**: Parameters, return values, examples
- **Module documentation**: Purpose and usage of code modules
- **README updates**: Project-level documentation updates

#### **Technical Specifications**
- **Database schema**: Table structures and relationships
- **Configuration reference**: All available settings and options
- **Security considerations**: Authentication, authorization, data protection
- **Performance notes**: Optimization tips and resource requirements

### Step 3: Documentation Standards

Follow these standards for all documentation:

1. **Structure and Format**:
   - Use clear headings and consistent formatting
   - Include table of contents for longer documents
   - Use code blocks with proper syntax highlighting
   - Add diagrams or flowcharts where helpful

2. **Content Quality**:
   - Write for the target audience (users vs developers)
   - Include practical examples and use cases
   - Provide copy-pasteable code snippets
   - Test all examples and instructions

3. **Accessibility**:
   - Use plain language and avoid unnecessary jargon
   - Include alt text for images and diagrams
   - Ensure proper heading hierarchy
   - Add search-friendly keywords

### Step 4: Documentation Placement

Place documentation in appropriate locations:

- **User docs**: `docs/user/` or `docs/guides/`
- **API docs**: `docs/api/` or integrate with OpenAPI/Swagger
- **Developer docs**: `docs/development/` or `CONTRIBUTING.md`
- **README updates**: Update main `README.md`
- **Inline comments**: Directly in code files
- **Architecture docs**: `docs/architecture/` or existing architecture directory

### Step 5: Validation and Quality Check

1. **Review for completeness**:
   - All features are documented
   - Examples work correctly
   - Links are functional
   - Screenshots/diagrams are current

2. **Test documentation**:
   - Follow user guides step-by-step
   - Test API examples
   - Verify setup instructions
   - Check code examples compile/run

3. **Update related documentation**:
   - Update existing docs that reference the new features
   - Ensure changelog entries are accurate
   - Update version information where needed

## Specialized Documentation Agents

When relevant, use specialized agents:

- **content_localization_coordinator** - For multi-language documentation
- **programmatic_seo_engineer** - For documentation site architecture
- **development_accessibility_pro** - For accessible documentation
- **api_builder** - For API documentation standards

## Output Format

Generate documentation in appropriate formats:
- **Markdown** for most documentation files
- **OpenAPI/Swagger** for API specifications  
- **JSDoc/TypeDoc** for inline code documentation
- **README updates** in existing format
- **Architecture diagrams** in mermaid or other suitable format

## Important Guidelines

1. **Keep documentation current**: Documentation should be updated with every feature change
2. **Make it discoverable**: Ensure documentation is linked from main docs and README
3. **Test examples**: All code examples should be tested and working
4. **Consider the audience**: Different documentation types serve different users
5. **Version appropriately**: Include version information where relevant

## Success Criteria

Documentation is complete when:
- ✅ All new features have user-facing documentation
- ✅ All APIs have complete documentation with examples
- ✅ Complex code has inline comments and explanations
- ✅ Setup/configuration instructions are clear and tested
- ✅ Existing documentation has been updated for changes
- ✅ Documentation is discoverable and properly linked
- ✅ All examples and instructions have been validated

What needs to be documented: $ARGUMENTS