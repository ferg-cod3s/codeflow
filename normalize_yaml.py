#!/usr/bin/env python3
import os
import re
import glob

def normalize_yaml_frontmatter(content):
    """Normalize YAML frontmatter to standard format"""
    
    # Split content into frontmatter and body
    parts = content.split('---', 2)
    if len(parts) < 3:
        return content
    
    frontmatter = parts[1]
    body = parts[2]
    
    # Extract individual fields
    lines = frontmatter.strip().split('\n')
    fields = {}
    current_field = None
    current_value = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if this is a new field
        if ':' in line and not line.startswith(' '):
            if current_field:
                fields[current_field] = '\n'.join(current_value)
            
            field_name = line.split(':', 1)[0].strip()
            field_value = line.split(':', 1)[1].strip() if ':' in line else ''
            current_field = field_name
            current_value = [field_value] if field_value else []
        else:
            # Continuation of previous field
            if current_field:
                current_value.append(line)
    
    # Add the last field
    if current_field:
        fields[current_field] = '\n'.join(current_value)
    
    # Standard field order
    standard_order = [
        'name', 'description', 'mode', 'temperature', 'model', 
        'tools', 'category', 'tags', 'allowed_directories'
    ]
    
    # Rebuild frontmatter in standard order
    normalized_lines = []
    for field in standard_order:
        if field in fields:
            if field == 'tools':
                # Special handling for tools section
                normalized_lines.append(f'{field}:')
                # Parse and normalize tools
                tools_content = fields[field]
                if tools_content.strip():
                    tool_lines = tools_content.strip().split('\n')
                    # Standard tool order
                    tool_order = ['write', 'edit', 'bash', 'patch', 'read', 'grep', 'glob', 'list', 'webfetch']
                    tool_dict = {}
                    
                    for line in tool_lines:
                        if ':' in line:
                            tool_name = line.split(':', 1)[0].strip()
                            tool_value = line.split(':', 1)[1].strip()
                            tool_dict[tool_name] = tool_value
                    
                    for tool in tool_order:
                        if tool in tool_dict:
                            normalized_lines.append(f'  {tool}: {tool_dict[tool]}')
                else:
                    normalized_lines.append('  # Tools configuration')
            else:
                # Handle multi-line fields
                field_lines = fields[field].split('\n')
                if len(field_lines) == 1:
                    normalized_lines.append(f'{field}: {field_lines[0]}')
                else:
                    normalized_lines.append(f'{field}:')
                    for line in field_lines:
                        if line.strip():
                            normalized_lines.append(f'  {line}')
    
    # Rebuild the content
    normalized_frontmatter = '\n'.join(normalized_lines)
    return f'---\n{normalized_frontmatter}\n---{body}'

def process_file(file_path):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has YAML frontmatter
        if not content.startswith('---'):
            return False, "No YAML frontmatter found"
        
        normalized_content = normalize_yaml_frontmatter(content)
        
        # Check if content changed
        if normalized_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(normalized_content)
            return True, "Normalized YAML frontmatter"
        else:
            return False, "Already normalized"
            
    except Exception as e:
        return False, f"Error processing file: {str(e)}"

def main():
    """Main function"""
    # Find all .md files in codeflow-agents directory
    agent_files = glob.glob('codeflow-agents/**/*.md', recursive=True)
    
    # Skip README.md
    agent_files = [f for f in agent_files if not f.endswith('README.md')]
    
    print(f"Found {len(agent_files)} agent files to process")
    
    changes_made = []
    errors = []
    
    for file_path in agent_files:
        changed, message = process_file(file_path)
        if changed:
            changes_made.append(file_path)
            print(f"✓ {file_path}: {message}")
        elif "Error" in message:
            errors.append(f"{file_path}: {message}")
            print(f"✗ {file_path}: {message}")
    
    print(f"\nSummary:")
    print(f"- Files normalized: {len(changes_made)}")
    print(f"- Files with errors: {len(errors)}")
    print(f"- Files already normalized: {len(agent_files) - len(changes_made) - len(errors)}")
    
    if changes_made:
        print(f"\nFiles that were changed:")
        for file in changes_made:
            print(f"  - {file}")

if __name__ == "__main__":
    main()
