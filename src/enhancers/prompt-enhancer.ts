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
  python: ['Instagram', 'Dropbox', 'Spotify', 'Netflix'],
  javascript: ['Google', 'Meta', 'Vercel', 'Shopify'],
  typescript: ['Microsoft', 'Vercel', 'Stripe', 'Airbnb'],
  java: ['Netflix', 'Amazon', 'LinkedIn', 'Uber'],
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
  rust: ['Mozilla', 'Cloudflare', 'Discord', 'AWS'],
  go: ['Google', 'Uber', 'Dropbox', 'Cloudflare'],
  ruby: ['Shopify', 'GitHub', 'Stripe', 'Airbnb'],
  php: ['Meta', 'Slack', 'Wikipedia', 'Automattic'],
  csharp: ['Microsoft', 'Unity', 'Stack Overflow', 'JetBrains'],
  default: ['Google', 'Netflix', 'Stripe', 'AWS']
};

// Domain-specific achievements for richer personas
const DOMAIN_ACHIEVEMENTS: Record<string, string[]> = {
  python: [
    'contributed to core Python libraries',
    'optimized applications handling billions of requests',
    'built data pipelines processing petabytes daily'
  ],
  typescript: [
    "contributed to TypeScript's compiler",
    'built enterprise-grade type utilities used by thousands',
    'designed type systems that catch bugs at compile time'
  ],
  java: [
    'led Java modernization efforts from Java 8 to 21+',
    'implemented virtual threads in production handling millions of concurrent connections',
    'built Spring Boot architectures serving billions of requests daily'
  ],
  frontend: [
    'built design systems used by thousands of developers',
    'optimized Core Web Vitals for sites with billions of pageviews',
    'created React patterns taught in conference workshops'
  ],
  backend: [
    'designed APIs handling millions of requests per second',
    'built event-driven architectures processing billions of events',
    'led migrations from monolith to microservices'
  ],
  database: [
    'optimized queries reducing latency by 10x',
    'designed schemas supporting billions of records',
    'led database migrations with zero downtime'
  ],
  architecture: [
    'designed systems at Netflix, Stripe, and AWS',
    'scaled systems from startup to billions of requests',
    'led major platform migrations'
  ],
  security: [
    'discovered critical vulnerabilities in major platforms',
    'built security frameworks protecting millions of users',
    'led incident response for high-profile breaches'
  ],
  devops: [
    'built CI/CD pipelines deploying thousands of times per day',
    'designed infrastructure handling millions of containers',
    'achieved 99.99% uptime for critical systems'
  ],
  default: [
    'built systems used by millions',
    'led major technical initiatives',
    'mentored dozens of engineers'
  ]
};

// Domain-specific stakes language
const DOMAIN_STAKES: Record<string, string> = {
  python: "Python code runs in production serving real users. Poor patterns create technical debt that compounds. Memory leaks and blocking calls cause cascading failures. I bet you can't write code that survives 5 years of maintenance without becoming a nightmare, but if you do, it's worth $200 to the team's velocity.",
  typescript: "TypeScript types are your first line of defense against bugs. Every `any` is a bug waiting to happen. Every weak type is a maintenance nightmare. I bet you can't write types that make invalid states unrepresentable, but if you do, it's worth $200 in prevented production incidents.",
  java: "Java code runs in production for years. Poor architectural decisions create technical debt that compounds. Memory leaks and thread pool exhaustion cause 3 AM pages. I bet you can't write code that survives 5 years of maintenance, but if you do, it's worth $200 to the team's sanity.",
  frontend: "Frontend code directly impacts user experience and business metrics. Slow pages lose customers. Inaccessible UIs exclude users and invite lawsuits. I bet you can't build components that are simultaneously beautiful, accessible, and performant, but if you do, it's worth $200 in user satisfaction and retention.",
  backend: "Backend code handles real user data and business logic. Poor API design creates integration nightmares. Missing error handling causes data loss. I bet you can't build APIs that are both elegant and bulletproof, but if you do, it's worth $200 in developer happiness.",
  database: "Database decisions are expensive to change. Poor schema design creates years of technical debt. Missing indexes cause production outages. I bet you can't design a schema that scales 100x without major changes, but if you do, it's worth $200 in avoided migrations.",
  architecture: "Architectural decisions are expensive to change. Getting this wrong costs months of engineering time and creates years of technical debt. I bet you can't find the perfect balance, but if you do, it's worth $200 to the team's future productivity.",
  security: "Security failures make headlines. Missing validation enables breaches. Poor authentication exposes user data. I bet you can't build a system that withstands determined attackers, but if you do, it's worth $200 in avoided incidents.",
  devops: "Infrastructure failures wake people up at 3 AM. Missing monitoring hides problems until they're crises. Poor automation creates deployment fear. I bet you can't build infrastructure that runs itself, but if you do, it's worth $200 in uninterrupted sleep.",
  default: "This task directly impacts production quality. Thoroughness is critical. I bet you can't deliver a perfect solution, but if you do, it's worth $200 to the team."
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
      enhanced = this.injectStakes(enhanced, metadata);
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
    const achievements = DOMAIN_ACHIEVEMENTS[domain] || DOMAIN_ACHIEVEMENTS.default;
    const years = this.detectSeniority(metadata);
    const role = this.generateRole(metadata);
    
    const selectedCompanies = this.shuffleArray([...companies]).slice(0, 3);
    const selectedAchievements = this.shuffleArray([...achievements]).slice(0, 2);
    
    return `You are a ${role} with ${years}+ years of experience, having ${selectedAchievements[0]} at ${selectedCompanies.join(', ')}. You've ${selectedAchievements[1]}, and your expertise is highly sought after in the industry.`;
  }
  
  private generateStakes(metadata: AgentMetadata): string {
    const domain = this.detectDomain(metadata);
    return DOMAIN_STAKES[domain] || DOMAIN_STAKES.default;
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
  
  private injectStakes(prompt: string, metadata: AgentMetadata = {}): string {
    const stakesPhrase = `\n\n**Stakes:** ${this.generateStakes(metadata)}`;
    
    // Add at the very end for maximum impact
    return prompt.trimEnd() + stakesPhrase;
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
