---
name: component
description: Generate React component with TypeScript and tests
---

# Component Generation

Creating React component: **$1**

## Component Configuration

**Component Name:** $1  
**Type:** $2  
**Location:** @src/components/$1  
**With Tests:** $3  
**With Stories:** $4

## Validation

!`if [ -z "$1" ]; then
  echo "❌ Error: Component name is required"
  echo "Usage: /component [name] [type] [with-tests] [with-stories]"
  exit 1
fi`

!`case "$2" in
  functional|class|hook|utility)
    echo "✅ Valid component type: $2"
    ;;
  *)
    echo "⚠️  Warning: Unknown type '$2', defaulting to functional"
    TYPE="functional"
    ;;
esac`

## Directory Structure

!`echo "📁 Creating directory structure..."`
!`mkdir -p src/components/$1`
!`mkdir -p src/components/$1/__tests__`
!`mkdir -p src/components/$1/__stories__`

## Component Template

!`echo "🔧 Generating component files..."`

### Component File

!`cat > src/components/$1/$1.tsx << 'EOF'
import React from 'react';

export interface $1Props {
// Define props here
className?: string;
children?: React.ReactNode;
}

export const $1: React.FC<$1Props> = ({
className = '',
children,
...props
}) => {
return (
<div
className={\`\${className} $1\`}
{...props} >
<h2>$1 Component</h2>
{children}
</div>
);
};

export default $1;
EOF`

### Index File

!`cat > src/components/$1/index.ts << 'EOF'
export { $1, type $1Props } from './$1';
export { default } from './$1';
EOF`

## Test Generation

!`if [ "$3" = "true" ] || [ "$3" = "yes" ]; then
echo "🧪 Generating test files..."

cat > src/components/$1/**tests**/$1.test.tsx << 'EOF'
import React from 'react';
import { render, screen } from '@testing-library/react';
import { $1 } from '../$1';

describe('$1 Component', () => {
it('renders without crashing', () => {
render(<$1 />);
expect(screen.getByText('$1 Component')).toBeInTheDocument();
});

it('applies custom className', () => {
render(<$1 className="custom-class" />);
const component = screen.getByText('$1 Component');
expect(component).toHaveClass('custom-class', '$1');
});

it('renders children correctly', () => {
render(
<$1>
<button>Test Button</button>
</$1>
);
expect(screen.getByText('Test Button')).toBeInTheDocument();
});

it('passes through additional props', () => {
render(<$1 data-testid="test-component" />);
expect(screen.getByTestId('test-component')).toBeInTheDocument();
});
});
EOF
fi`

## Storybook Stories

!`if [ "$4" = "true" ] || [ "$4" = "yes" ]; then
echo "📖 Generating Storybook stories..."

cat > src/components/$1/**stories**/$1.stories.tsx << 'EOF'
import type { Meta, StoryObj } from '@storybook/react';
import { $1 } from '../$1';

const meta: Meta<typeof $1> = {
title: 'Components/$1',
component: $1,
parameters: {
layout: 'centered',
},
tags: ['autodocs'],
argTypes: {
className: {
control: 'text',
description: 'Additional CSS classes',
},
children: {
control: 'text',
description: 'Child elements to render',
},
},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
args: {
children: 'Default $1 content',
},
};

export const WithCustomClass: Story = {
args: {
className: 'custom-styling',
children: 'Component with custom class',
},
};

export const WithChildren: Story = {
args: {
children: (
<div>
<p>Paragraph content</p>
<button>Action Button</button>
</div>
),
},
};
EOF
fi`

## CSS Module (Optional)

!`if [ "$2" = "functional" ] || [ "$2" = "class" ]; then
echo "🎨 Creating CSS module..."

cat > src/components/$1/$1.module.css << 'EOF'
.container {
padding: 1rem;
border: 1px solid #e2e8f0;
border-radius: 0.5rem;
background-color: #ffffff;
}

.title {
margin: 0 0 1rem 0;
font-size: 1.25rem;
font-weight: 600;
color: #1a202c;
}
EOF
fi`

## Update Barrel Export

!`echo "📦 Updating barrel exports..."`
!`if [ -f src/components/index.ts ]; then
  echo "export * from './$1';" >> src/components/index.ts
else
  cat > src/components/index.ts << 'EOF'
// Component exports
export * from './$1';
EOF
fi`

## File References for Context

The following files were created and are now available for review:

- **@src/components/$1/$1.tsx** - Main component file
- **@src/components/$1/index.ts** - Export file
- **@src/components/$1/**tests**/$1.test.tsx** - Test file (if enabled)
- **@src/components/$1/**stories**/$1.stories.tsx** - Storybook stories (if enabled)
- **@src/components/$1/$1.module.css** - CSS module (if applicable)

## Usage Instructions

### Import and Use

\`\`\`tsx
import { $1 } from '@/components/$1';

// Basic usage
<$1 />

// With props
<$1 className="custom-class">

  <p>Child content</p>
</$1>
\`\`\`

### Running Tests

\`\`\`bash

# Run tests for this component

npm test -- $1

# Run tests with coverage

npm run test:coverage -- $1
\`\`\`

### Storybook

\`\`\`bash

# View stories in Storybook

npm run storybook
\`\`\`

## Summary

!`echo "✅ Component '$1' created successfully!"`
!`echo "📁 Location: src/components/$1/"`
!`echo "🧪 Tests: $3"`
!`echo "📖 Stories: $4"`
!`echo ""`
!`echo "📋 Next steps:"`
!`echo "1. Review the generated files"`
!`echo "2. Customize the component props and logic"`
!`echo "3. Add specific test cases for your use case"`
!`echo "4. Update Storybook stories as needed"`
