import { describe, test, expect } from 'bun:test';
import { PromptEnhancer } from '../../src/enhancers/prompt-enhancer.js';

describe('PromptEnhancer', () => {
  const enhancer = new PromptEnhancer();

  describe('enhancePrompt', () => {
    test('adds expert persona when missing', () => {
      const prompt = 'Help me write Python code.';
      const result = enhancer.enhancePrompt(prompt, { name: 'python_pro' });
      
      expect(result.enhanced).toContain('years');
      expect(result.enhanced).toContain('experience');
      expect(result.techniquesApplied.some(t => t.includes('Expert Persona'))).toBe(true);
    });

    test('skips persona if already present', () => {
      const prompt = 'You are a senior developer with 15 years of experience at Google.';
      const result = enhancer.enhancePrompt(prompt, {});
      
      expect(result.techniquesApplied).not.toContain(expect.stringContaining('Expert Persona'));
    });

    test('adds step-by-step reasoning', () => {
      const prompt = 'Solve this problem.';
      const result = enhancer.enhancePrompt(prompt, {});
      
      // Check for systematic approach (the actual phrase used)
      expect(result.enhanced.toLowerCase()).toContain('systematic');
      expect(result.techniquesApplied.some(t => t.includes('Step-by-Step'))).toBe(true);
    });

    test('skips step-by-step if already present', () => {
      const prompt = 'Take a deep breath and solve this step by step.';
      const result = enhancer.enhancePrompt(prompt, {});
      
      expect(result.techniquesApplied).not.toContain(expect.stringContaining('Step-by-Step'));
    });

    test('adds self-evaluation on standard level', () => {
      const prompt = 'Write some code.';
      const result = enhancer.enhancePrompt(prompt, {}, { level: 'standard' });
      
      expect(result.enhanced.toLowerCase()).toContain('confidence');
      expect(result.techniquesApplied.some(t => t.includes('Self-Evaluation'))).toBe(true);
    });

    test('adds stakes language on maximum level', () => {
      const prompt = 'Fix this bug.';
      const result = enhancer.enhancePrompt(prompt, {}, { level: 'maximum' });
      
      expect(result.enhanced.toLowerCase()).toContain('critical');
      expect(result.techniquesApplied.some(t => t.includes('Stakes'))).toBe(true);
    });

    test('minimal level only adds step-by-step', () => {
      const prompt = 'Simple task.';
      const result = enhancer.enhancePrompt(prompt, {}, { level: 'minimal' });
      
      expect(result.techniquesApplied.length).toBe(1);
      expect(result.techniquesApplied[0]).toContain('Step-by-Step');
    });

    test('respects individual technique options', () => {
      const prompt = 'Do something.';
      const result = enhancer.enhancePrompt(prompt, {}, { 
        persona: false, 
        stepByStep: false,
        selfEval: false 
      });
      
      expect(result.techniquesApplied.length).toBe(0);
    });
  });

  describe('enhanceAgentContent', () => {
    test('handles frontmatter + body format', () => {
      const content = `---
name: test_agent
description: A test agent
---

You help with testing.`;

      const result = enhancer.enhanceAgentContent(content);
      
      expect(result).toContain('---');
      expect(result).toContain('name: test_agent');
      expect(result).toContain('years');
    });

    test('handles content without frontmatter', () => {
      const content = 'Just a simple prompt without frontmatter.';
      const result = enhancer.enhanceAgentContent(content);
      
      // Should contain systematic approach (step-by-step variation)
      expect(result.toLowerCase()).toContain('systematic');
    });
  });

  describe('domain detection', () => {
    test('detects Python domain', () => {
      const result = enhancer.enhancePrompt('', { 
        name: 'python_pro',
        tags: ['python', 'fastapi']
      });
      
      // Should include Python-related companies
      expect(result.enhanced).toMatch(/Google|Dropbox|Instagram|Spotify/);
    });

    test('detects frontend domain', () => {
      const result = enhancer.enhancePrompt('', { 
        name: 'frontend_developer',
        description: 'React and Vue expert'
      });
      
      // Should include frontend companies
      expect(result.enhanced).toMatch(/Vercel|Netlify|Shopify|Airbnb/);
    });
  });

  describe('expected improvement calculation', () => {
    test('returns appropriate improvement estimate', () => {
      const result1 = enhancer.enhancePrompt('test', {}, { level: 'minimal' });
      expect(result1.expectedImprovement).toContain('%');

      const result2 = enhancer.enhancePrompt('test', {}, { level: 'standard' });
      expect(result2.expectedImprovement).toContain('%');

      const result3 = enhancer.enhancePrompt('test', {}, { level: 'maximum' });
      expect(result3.expectedImprovement).toContain('%');
    });
  });
});
