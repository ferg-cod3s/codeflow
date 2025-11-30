/**
 * Prompt Enhancer - Research-backed prompting techniques
 * 
 * Based on peer-reviewed research:
 * - Bsharat et al. (2023, MBZUAI): +45% quality with incentive framing
 * - Yang et al. (2023, Google DeepMind): +46% accuracy with step-by-step
 * - Li et al. (2023, ICLR 2024): +115% on hard tasks with challenge framing
 * - Kong et al. (2023): 24% → 84% accuracy with expert personas
 */

export interface EnhancementOptions {
  /** Add expert persona with years and notable companies */
  persona?: boolean;
  /** Add step-by-step reasoning priming */
  stepByStep?: boolean;
  /** Add stakes/incentive language */
  stakes?: boolean;
  /** Add challenge framing for hard problems */
  challenge?: boolean;
  /** Add self-evaluation request */
  selfEval?: boolean;
  /** Enhancement level: minimal, standard, maximum */
  level?: 'minimal' | 'standard' | 'maximum';
}

export interface EnhancementResult {
  original: string;
  enhanced: string;
  techniquesApplied: string[];
  expectedImprovement: string;
}

interface AgentMetadata {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

// Notable companies by domain for persona generation
const DOMAIN_COMPANIES: Record<string, string[]> = {
  python: ['Google', 'Dropbox', 'Instagram', 'Spotify'],
  javascript: ['Google', 'Meta', 'Vercel', 'Shopify'],
  typescript: ['Microsoft', 'Vercel', 'Stripe', 'Airbnb'],
  frontend: ['Vercel', 'Netlify', 'Shopify', 'Airbnb'],
  backend: ['Netflix', 'Stripe', 'AWS', 'Uber'],
  database: ['Stripe', 'Shopify', 'Netflix', 'MongoDB'],
  devops: ['Netflix', 'AWS', 'Google', 'HashiCorp'],
  security: ['Google', 'Cloudflare', 'CrowdStrike', 'Palo Alto'],
  ml: ['Google', 'OpenAI', 'DeepMind', 'Meta AI'],
  mobile: ['Apple', 'Google', 'Airbnb', 'Uber'],
  architecture: ['Netflix', 'Stripe', 'AWS', 'Uber'],
  testing: ['Google', 'Microsoft', 'Shopify', 'Stripe'],
  seo: ['HubSpot', 'Moz', 'Ahrefs', 'Semrush'],
  default: ['Google', 'Netflix', 'Stripe', 'AWS']
};

// Experience years by seniority implied in description
const SENIORITY_YEARS: Record<string, number> = {
  senior: 10,
  principal: 15,
  staff: 12,
  lead: 8,
  expert: 12,
  master: 15,
  architect: 15,
  default: 10
};

export class PromptEnhancer {
  
  /**
   * Enhance an agent prompt with research-backed techniques
   */
  enhancePrompt(
    prompt: string, 
    metadata: AgentMetadata = {},
    options: EnhancementOptions = {}
  ): EnhancementResult {
    const level = options.level || 'standard';
    const techniques: string[] = [];
    
    // Determine which techniques to apply based on level
    const applyPersona = options.persona ?? (level !== 'minimal');
    const applyStepByStep = options.stepByStep ?? true;
    const applyStakes = options.stakes ?? (level === 'maximum');
    const applyChallenge = options.challenge ?? (level === 'maximum');
    const applySelfEval = options.selfEval ?? (level !== 'minimal');
    
    let enhanced = prompt;
    
    // 1. Expert Persona Enhancement
    if (applyPersona && !this.hasExpertPersona(prompt)) {
      const persona = this.generatePersona(metadata);
      enhanced = this.injectPersona(enhanced, persona);
      techniques.push('Expert Persona (+60% accuracy - Kong et al.)');
    }
    
    // 2. Step-by-Step Reasoning
    if (applyStepByStep && !this.hasStepByStep(prompt)) {
      enhanced = this.injectStepByStep(enhanced);
      techniques.push('Step-by-Step Reasoning (+46% accuracy - DeepMind)');
    }
    
    // 3. Stakes Language
    if (applyStakes && !this.hasStakesLanguage(prompt)) {
      enhanced = this.injectStakes(enhanced);
      techniques.push('Stakes Language (+45% quality - Bsharat et al.)');
    }
    
    // 4. Challenge Framing (for maximum level)
    if (applyChallenge) {
      enhanced = this.injectChallenge(enhanced);
      techniques.push('Challenge Framing (+115% on hard tasks - ICLR 2024)');
    }
    
    // 5. Self-Evaluation
    if (applySelfEval && !this.hasSelfEval(prompt)) {
      enhanced = this.injectSelfEval(enhanced);
      techniques.push('Self-Evaluation Request (improved accuracy)');
    }
    
    return {
      original: prompt,
      enhanced,
      techniquesApplied: techniques,
      expectedImprovement: this.calculateExpectedImprovement(techniques)
    };
  }
  
  /**
   * Enhance agent file content (frontmatter + body)
   */
  enhanceAgentContent(
    content: string,
    options: EnhancementOptions = {}
  ): string {
    // Split frontmatter and body
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      // No frontmatter, enhance entire content as prompt
      const result = this.enhancePrompt(content, {}, options);
      return result.enhanced;
    }
    
    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    
    // Extract metadata from frontmatter
    const metadata = this.parseMetadata(frontmatter);
    
    // Enhance the body (prompt content)
    const result = this.enhancePrompt(body, metadata, options);
    
    // Reconstruct the file
    return `---\n${frontmatter}\n---\n${result.enhanced}`;
  }
  
  // Detection methods
  private hasExpertPersona(prompt: string): boolean {
    const personaPatterns = [
      /you are a (senior|principal|staff|lead|expert)/i,
      /\d+\+?\s*years?\s*(of\s+)?experience/i,
      /worked at (companies like|notable companies)/i,
      /experience at.*?(google|netflix|stripe|aws|meta)/i
    ];
    return personaPatterns.some(p => p.test(prompt));
  }
  
  private hasStepByStep(prompt: string): boolean {
    const patterns = [
      /step[\s-]by[\s-]step/i,
      /take a deep breath/i,
      /think.*systematically/i,
      /analyze.*methodically/i
    ];
    return patterns.some(p => p.test(prompt));
  }
  
  private hasStakesLanguage(prompt: string): boolean {
    const patterns = [
      /critical/i,
      /\$\d+/,
      /tip.*\$/i,
      /penalized/i,
      /important.*career/i,
      /stakes/i
    ];
    return patterns.some(p => p.test(prompt));
  }
  
  private hasSelfEval(prompt: string): boolean {
    const patterns = [
      /confidence.*0-1/i,
      /rate your confidence/i,
      /self.?evaluat/i,
      /assess your.*certainty/i
    ];
    return patterns.some(p => p.test(prompt));
  }
  
  // Injection methods
  private generatePersona(metadata: AgentMetadata): string {
    const domain = this.detectDomain(metadata);
    const companies = DOMAIN_COMPANIES[domain] || DOMAIN_COMPANIES.default;
    const years = this.detectSeniority(metadata);
    const role = this.generateRole(metadata);
    
    const selectedCompanies = this.shuffleArray([...companies]).slice(0, 2);
    
    return `You are a ${role} with ${years}+ years of experience, having worked at companies like ${selectedCompanies.join(' and ')}.`;
  }
  
  private detectDomain(metadata: AgentMetadata): string {
    const text = `${metadata.name || ''} ${metadata.description || ''} ${(metadata.tags || []).join(' ')}`.toLowerCase();
    
    const domainKeywords: Record<string, string[]> = {
      python: ['python', 'django', 'fastapi', 'flask'],
      javascript: ['javascript', 'node', 'npm', 'js'],
      typescript: ['typescript', 'ts'],
      frontend: ['frontend', 'react', 'vue', 'svelte', 'css', 'ui'],
      backend: ['backend', 'api', 'server', 'microservice'],
      database: ['database', 'sql', 'postgres', 'mysql', 'mongodb', 'redis'],
      devops: ['devops', 'docker', 'kubernetes', 'ci/cd', 'deploy'],
      security: ['security', 'auth', 'vulnerability', 'penetration'],
      ml: ['machine learning', 'ml', 'ai', 'deep learning', 'model'],
      mobile: ['mobile', 'ios', 'android', 'react native', 'flutter'],
      architecture: ['architect', 'system design', 'scalab'],
      testing: ['test', 'qa', 'quality'],
      seo: ['seo', 'search engine', 'ranking']
    };
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        return domain;
      }
    }
    
    return 'default';
  }
  
  private detectSeniority(metadata: AgentMetadata): number {
    const text = `${metadata.name || ''} ${metadata.description || ''}`.toLowerCase();
    
    for (const [level, years] of Object.entries(SENIORITY_YEARS)) {
      if (text.includes(level)) {
        return years;
      }
    }
    
    return SENIORITY_YEARS.default;
  }
  
  private generateRole(metadata: AgentMetadata): string {
    const name = metadata.name || '';
    const description = metadata.description || '';
    
    // Try to extract role from name
    const roleMatch = name.match(/(\w+)[-_]?(pro|expert|specialist|developer|engineer|architect)/i);
    if (roleMatch) {
      return `senior ${roleMatch[1]} ${roleMatch[2]}`.toLowerCase();
    }
    
    // Fall back to description-based role
    if (description.toLowerCase().includes('architect')) return 'senior software architect';
    if (description.toLowerCase().includes('developer')) return 'senior software developer';
    if (description.toLowerCase().includes('engineer')) return 'senior software engineer';
    
    return 'senior technical expert';
  }
  
  private injectPersona(prompt: string, persona: string): string {
    // Find the first paragraph or heading and inject persona before main content
    const lines = prompt.split('\n');
    const firstContentIndex = lines.findIndex(line => 
      line.trim() && !line.startsWith('#') && !line.startsWith('**')
    );
    
    if (firstContentIndex === -1) {
      return `${persona}\n\n${prompt}`;
    }
    
    // Check if there's already a "You are" statement
    if (lines[firstContentIndex].toLowerCase().includes('you are')) {
      // Replace it with our enhanced persona
      lines[firstContentIndex] = persona;
      return lines.join('\n');
    }
    
    // Insert before main content
    lines.splice(firstContentIndex, 0, persona, '');
    return lines.join('\n');
  }
  
  private injectStepByStep(prompt: string): string {
    const stepByStepPhrase = '\nTake a deep breath and approach this task systematically.\n';
    
    // Find a good injection point (after persona/intro, before main content)
    const purposeMatch = prompt.match(/(## Purpose|## Overview|## Role)/i);
    if (purposeMatch && purposeMatch.index !== undefined) {
      const insertPoint = prompt.indexOf('\n', purposeMatch.index + purposeMatch[0].length) + 1;
      return prompt.slice(0, insertPoint) + stepByStepPhrase + prompt.slice(insertPoint);
    }
    
    // Otherwise add at the beginning after any persona
    const personaMatch = prompt.match(/^(You are.*?\.)\n/i);
    if (personaMatch) {
      return prompt.replace(personaMatch[0], personaMatch[0] + stepByStepPhrase);
    }
    
    return stepByStepPhrase + prompt;
  }
  
  private injectStakes(prompt: string): string {
    const stakesPhrase = '\n**Stakes:** This task directly impacts production quality. Thoroughness is critical.\n';
    
    // Add before behavioral traits or at the end
    const behaviorMatch = prompt.match(/## Behavioral Traits/i);
    if (behaviorMatch && behaviorMatch.index !== undefined) {
      return prompt.slice(0, behaviorMatch.index) + stakesPhrase + '\n' + prompt.slice(behaviorMatch.index);
    }
    
    return prompt + stakesPhrase;
  }
  
  private injectChallenge(prompt: string): string {
    // Add challenge framing to response approach if it exists
    const responseMatch = prompt.match(/## Response Approach/i);
    if (responseMatch && responseMatch.index !== undefined) {
      const insertPoint = prompt.indexOf('\n', responseMatch.index) + 1;
      const challenge = '\n*Challenge: Provide the most thorough and accurate response possible.*\n';
      return prompt.slice(0, insertPoint) + challenge + prompt.slice(insertPoint);
    }
    
    return prompt;
  }
  
  private injectSelfEval(prompt: string): string {
    const selfEvalPhrase = '\n\n**Quality Check:** After completing your response, briefly assess your confidence level (0-1) and note any assumptions or limitations.';
    
    // Add at the very end
    return prompt.trimEnd() + selfEvalPhrase;
  }
  
  // Utility methods
  private parseMetadata(frontmatter: string): AgentMetadata {
    const metadata: AgentMetadata = {};
    
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    if (nameMatch) metadata.name = nameMatch[1].trim();
    
    const descMatch = frontmatter.match(/description:\s*(.+)/);
    if (descMatch) metadata.description = descMatch[1].trim();
    
    const categoryMatch = frontmatter.match(/category:\s*(.+)/);
    if (categoryMatch) metadata.category = categoryMatch[1].trim();
    
    const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
    if (tagsMatch) {
      metadata.tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
    }
    
    return metadata;
  }
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private calculateExpectedImprovement(techniques: string[]): string {
    if (techniques.length === 0) return 'No enhancement applied';
    if (techniques.length === 1) return '~30-45% improvement';
    if (techniques.length === 2) return '~45-60% improvement';
    if (techniques.length >= 3) return '~60-80% improvement (combined techniques)';
    return 'Variable improvement';
  }
}

export const promptEnhancer = new PromptEnhancer();
