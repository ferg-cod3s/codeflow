#!/usr/bin/env python3
"""
Simple hello world function demonstrating modern Python practices.

This module provides a basic greeting function with proper type hints,
docstrings, and error handling following Python 3.12+ best practices.
"""

from __future__ import annotations

from typing import Optional


def hello_world(name: Optional[str] = None) -> str:
    """
    Return a greeting message.
    
    Args:
        name: Optional name to greet. If None, returns a generic greeting.
        
    Returns:
        A greeting string.
        
    Examples:
        >>> hello_world()
        'Hello, World!'
        >>> hello_world("Alice")
        'Hello, Alice!'
    """
    if name is None:
        return "Hello, World!"
    
    # Validate input
    if not isinstance(name, str):
        raise TypeError(f"Expected str or None, got {type(name).__name__}")
    
    # Clean up whitespace
    clean_name = name.strip()
    if not clean_name:
        return "Hello, World!"
    
    return f"Hello, {clean_name}!"


def main() -> None:
    """Main function demonstrating usage."""
    print(hello_world())
    print(hello_world("Python Developer"))


if __name__ == "__main__":
    main()