import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { PromptEnhancer, EnhancementOptions } from '../enhancers/prompt-enhancer.js';
import { readFile, writeFile, readAllFiles, ensureDir } from '../utils/file-utils.js';

export const enhanceCommand = new Command('enhance')
  .description('Enhance agent prompts with research-backed techniques (+45-80% quality)')
  .argument('[input]', 'Input file or directory (defaults to stdin for single prompt)')
  .option('-o, --output <path>', 'Output file or directory')
  .option('-l, --level <level>', 'Enhancement level: minimal, standard, maximum', 'standard')
  .option('--no-persona', 'Skip expert persona enhancement')
  .option('--no-step-by-step', 'Skip step-by-step reasoning')
  .option('--stakes', 'Add stakes/incentive language')
  .option('--challenge', 'Add challenge framing (for hard problems)')
  .option('--no-self-eval', 'Skip self-evaluation request')
  .option('-d, --dry-run', 'Show enhanced output without writing files')
  .option('-v, --verbose', 'Show detailed enhancement report')
  .addHelpText('after', `
Research Basis:
  These techniques are backed by peer-reviewed research:
  
  - Expert Personas: +60% accuracy (Kong et al., 2023)
  - Step-by-Step: +46% accuracy (Yang et al., Google DeepMind)
  - Stakes/Incentive: +45% quality (Bsharat et al., MBZUAI)
  - Challenge Framing: +115% on hard tasks (Li et al., ICLR 2024)

Examples:
  # Enhance a single agent file
  $ codeflow enhance agents/python_pro.md -o enhanced/python_pro.md

  # Enhance all agents in a directory
  $ codeflow enhance ./agents --output ./enhanced-agents

  # Enhance with maximum techniques
  $ codeflow enhance agent.md --level maximum --stakes --challenge

  # Preview enhancement without writing
  $ codeflow enhance agent.md --dry-run --verbose

  # Enhance a prompt from stdin
  $ echo "Help me optimize this query" | codeflow enhance

Enhancement Levels:
  minimal   - Step-by-step only (fastest, least intrusive)
  standard  - Persona + step-by-step + self-eval (recommended)
  maximum   - All techniques including stakes and challenge framing`)
  .action(async (input, options) => {
    const enhancer = new PromptEnhancer();
    
    const enhancementOptions: EnhancementOptions = {
      level: options.level,
      persona: options.persona,
      stepByStep: options.stepByStep,
      stakes: options.stakes || options.level === 'maximum',
      challenge: options.challenge || options.level === 'maximum',
      selfEval: options.selfEval
    };
    
    try {
      // Handle stdin input (no input argument)
      if (!input) {
        const stdinContent = await readStdin();
        if (!stdinContent) {
          console.error(chalk.red('❌ No input provided. Use a file path or pipe content to stdin.'));
          process.exit(1);
        }
        
        const result = enhancer.enhancePrompt(stdinContent, {}, enhancementOptions);
        
        if (options.verbose) {
          printEnhancementReport(result);
        }
        
        console.log(result.enhanced);
        return;
      }
      
      const inputPath = path.resolve(input);
      const stats = fs.statSync(inputPath);
      
      if (stats.isFile()) {
        // Single file enhancement
        await enhanceSingleFile(enhancer, inputPath, options.output, enhancementOptions, options);
      } else if (stats.isDirectory()) {
        // Directory enhancement
        await enhanceDirectory(enhancer, inputPath, options.output, enhancementOptions, options);
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Enhancement failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on('end', () => resolve(data));
    
    // Timeout after 100ms if no data
    setTimeout(() => resolve(data), 100);
  });
}

async function enhanceSingleFile(
  enhancer: PromptEnhancer,
  inputPath: string,
  outputPath: string | undefined,
  enhancementOptions: EnhancementOptions,
  cliOptions: any
): Promise<void> {
  const content = await readFile(inputPath);
  const enhanced = enhancer.enhanceAgentContent(content, enhancementOptions);
  
  // For verbose mode, also get the detailed result
  if (cliOptions.verbose) {
    const detailedResult = enhancer.enhancePrompt(content, {}, enhancementOptions);
    printEnhancementReport(detailedResult);
  }
  
  if (cliOptions.dryRun) {
    console.log(chalk.blue('\n📄 Enhanced content (dry run):\n'));
    console.log(enhanced);
    return;
  }
  
  const finalOutputPath = outputPath || inputPath;
  await writeFile(finalOutputPath, enhanced);
  
  console.log(chalk.green(`✅ Enhanced: ${path.basename(inputPath)}`));
  console.log(chalk.white(`   Output: ${finalOutputPath}`));
}

async function enhanceDirectory(
  enhancer: PromptEnhancer,
  inputDir: string,
  outputDir: string | undefined,
  enhancementOptions: EnhancementOptions,
  cliOptions: any
): Promise<void> {
  const files = await readAllFiles('**/*.md', inputDir);
  
  if (files.length === 0) {
    console.log(chalk.yellow('⚠️  No .md files found in directory'));
    return;
  }
  
  const finalOutputDir = outputDir || inputDir;
  
  if (!cliOptions.dryRun) {
    await ensureDir(finalOutputDir);
  }
  
  console.log(chalk.blue(`🔄 Enhancing ${files.length} files...\n`));
  
  let enhanced = 0;
  let failed = 0;
  
  for (const file of files) {
    try {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(finalOutputDir, file);
      
      const content = await readFile(inputPath);
      const enhancedContent = enhancer.enhanceAgentContent(content, enhancementOptions);
      
      if (!cliOptions.dryRun) {
        await ensureDir(path.dirname(outputPath));
        await writeFile(outputPath, enhancedContent);
      }
      
      console.log(chalk.green(`✅ ${file}`));
      enhanced++;
      
    } catch (error) {
      console.log(chalk.red(`❌ ${file}: ${error instanceof Error ? error.message : String(error)}`));
      failed++;
    }
  }
  
  console.log(chalk.blue(`\n📊 Results:`));
  console.log(chalk.green(`   Enhanced: ${enhanced}`));
  console.log(chalk.red(`   Failed: ${failed}`));
  
  if (!cliOptions.dryRun) {
    console.log(chalk.white(`   Output: ${finalOutputDir}`));
  }
}

function printEnhancementReport(result: { techniquesApplied: string[]; expectedImprovement: string }): void {
  console.log(chalk.blue('\n📊 Enhancement Report\n'));
  
  if (result.techniquesApplied.length === 0) {
    console.log(chalk.yellow('   No techniques applied (content already optimized)'));
  } else {
    console.log(chalk.white('   Techniques Applied:'));
    result.techniquesApplied.forEach(technique => {
      console.log(chalk.green(`   ✓ ${technique}`));
    });
  }
  
  console.log(chalk.white(`\n   Expected Improvement: ${result.expectedImprovement}`));
  console.log('');
}
