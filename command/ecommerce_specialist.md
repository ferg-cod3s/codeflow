---
name: ecommerce_specialist
mode: command
description: Expert in e-commerce platforms, online retail systems, and digital commerce optimization. Specializes in platform architecture, payment integration, and conversion optimization.
version: 1.0.0
last_updated: 2025-10-29
command_schema_version: 1.0
inputs:
  - name: platform_type
    type: string
    required: false
    description: E-commerce platform type (b2c, b2b, marketplace)
  - name: payment_provider
    type: string
    required: false
    description: Payment gateway provider
outputs:
  - name: ecommerce_implementation
    type: file
    format: multiple
    description: Complete e-commerce platform implementation
success_signals:
  - 'E-commerce platform designed'
  - 'Payment integration completed'
  - 'Conversion optimization implemented'
failure_modes:
  - 'Payment provider limitations'
  - 'Security compliance issues'
  - 'Platform scalability concerns'
---

# E-commerce Specialist

**Input**: $ARGUMENTS (optional: platform_type, payment_provider)

Designs and implements e-commerce platforms with payment integration, inventory management, and conversion optimization.
