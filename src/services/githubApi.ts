/**
 * GitHub API Service for Update Notifications
 * 
 * Why this matters: This service connects to GitHub's API to check for new commits,
 * allowing us to detect when updates are available and notify users.
 * It filters out non-meaningful commits (docs, config changes) to reduce noise.
 */

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { 
      date: string;
      name: string;
    };
  };
  html_url: string;
}

interface GitHubApiError {
  message: string;
  status?: number;
}

/**
 * Fetches latest commits from the GitHub repository
 * Why this matters: This is our source of truth for detecting new deployments.
 * We use the GitHub API instead of build hashes because it gives us meaningful
 * commit information and lets us filter out non-user-facing changes.
 */
export const fetchLatestCommits = async (since?: string): Promise<GitHubCommit[]> => {
  const token = process.env.REACT_APP_GITHUB_TOKEN;
  const repo = process.env.REACT_APP_GITHUB_REPO;

  if (!token || !repo) {
    throw new Error('GitHub configuration missing. Please check REACT_APP_GITHUB_TOKEN and REACT_APP_GITHUB_REPO environment variables.');
  }

  const url = `https://api.github.com/repos/${repo}/commits`;
  const params = since ? `?since=${since}&per_page=10` : '?per_page=10';
  
  try {
    const response = await fetch(`${url}${params}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Apollo-Reddit-Scraper-Update-Checker'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub API Error:', error);
    throw error;
  }
};

/**
 * Filters commits to only include meaningful updates
 * Why this matters: Users shouldn't be notified about documentation updates,
 * configuration changes, or other non-functional changes. This keeps notifications
 * relevant and prevents notification fatigue.
 */
export const filterMeaningfulCommits = (commits: GitHubCommit[]): GitHubCommit[] => {
  return commits.filter(commit => {
    const message = commit.commit.message.toLowerCase();
    
    // Skip commits that are explicitly marked to skip notifications
    if (message.includes('[skip-notification]') || message.includes('[skip-notify]')) {
      return false;
    }
    
    // Always include commits that start with meaningful action words
    if (
      message.startsWith('add/') ||
      message.startsWith('improve/') ||
      message.startsWith('update/') ||
      message.startsWith('new/') ||
      message.startsWith('feat:') ||
      message.startsWith('fix:') ||
      message.startsWith('perf:') ||
      message.includes('feature') ||
      message.includes('bug fix') ||
      message.includes('improvement')
    ) {
      return true;
    }
    
    // Skip documentation, configuration, and maintenance commits
    if (
      message.startsWith('docs:') ||
      message.startsWith('doc:') ||
      message.startsWith('config:') ||
      message.startsWith('chore:') ||
      message.startsWith('style:') ||
      message.startsWith('refactor:') && !message.includes('feature') ||
      message.includes('readme') ||
      message.includes('gitignore') ||
      message.includes('package-lock.json') ||
      message.includes('yarn.lock')
    ) {
      return false;
    }
    
    return true;
  });
};

/**
 * Test GitHub API connection
 * Why this matters: Before implementing the full update checker, we need to verify
 * that our GitHub token works and we can successfully fetch commits.
 */
export const testGitHubConnection = async (): Promise<{ success: boolean; message: string; commits?: GitHubCommit[] }> => {
  try {
    console.log('Testing GitHub API connection...');
    
    const commits = await fetchLatestCommits();
    const meaningfulCommits = filterMeaningfulCommits(commits);
    
    return {
      success: true,
      message: `Successfully connected! Found ${commits.length} total commits, ${meaningfulCommits.length} meaningful commits.`,
      commits: meaningfulCommits.slice(0, 3) // Return first 3 for testing
    };
  } catch (error) {
    return {
      success: false,
      message: `GitHub API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Get commit summary for display in notifications
 * Why this matters: When showing update notifications, users want to know
 * what changed. This creates user-friendly summaries from commit messages.
 */
export const getCommitSummary = (commits: GitHubCommit[]): string => {
  if (commits.length === 0) return 'No updates available';
  if (commits.length === 1) return commits[0].commit.message.split('\n')[0];
  
  const types = commits.map(commit => {
    const message = commit.commit.message.toLowerCase();
    if (message.startsWith('feat:') || message.includes('feature')) return 'features';
    if (message.startsWith('fix:') || message.includes('bug')) return 'fixes';
    if (message.startsWith('perf:') || message.includes('performance')) return 'improvements';
    return 'updates';
  });
  
  const uniqueTypes = Array.from(new Set(types));
  return `${commits.length} new ${uniqueTypes.join(' and ')} available`;
};
