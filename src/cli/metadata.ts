import { execSync } from "node:child_process";





export async function metadata() {
  // Collect current date/time with timezone
  const now = new Date();
  const dateTimeTz = now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
    hour12: false
  }).replace(",", "");
  
  // Create timestamp for filename
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const filenameTz = `${year}-${month}-${day}`;
  
  // Git information
  let gitCommit = "";
  let gitBranch = "";
  let repoName = "";
  
  try {
    // Check if we're in a git repository
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    
    // Get repository info
    const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
    repoName = repoRoot.split("/").pop() || "";
    
    // Get current branch
    try {
      gitBranch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
    } catch {
      gitBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
    }
    
    // Get current commit hash
    gitCommit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    // Not in a git repository or git not available
  }
  

  
  // Output metadata in XML format
  console.log(`Current Date/Time (TZ): ${dateTimeTz}`);
  if (gitCommit) console.log(`<git_commit>${gitCommit}</git_commit>`);
  if (gitBranch) console.log(`<branch>${gitBranch}</branch>`);
  if (repoName) console.log(`<repository>${repoName}</repository>`);
  console.log(`<last_updated>${filenameTz}</last_updated>`);
  console.log(`<date>${filenameTz}</date>`);
}