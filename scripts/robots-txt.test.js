// @vitest-environment node
/**
 * public/robots.txt as crawlers read it (RFC 9309): a crawler obeys only the group whose
 * user-agent line names it, or the * group when none does, so a rule in the * group does
 * not reach a crawler that has a group of its own.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROBOTS_TXT = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../public/robots.txt'),
  'utf8'
);

/** The groups: one or more user-agent lines, then the rules up to the next of them */
function groupsOf(text) {
  const groups = [];
  let group;
  for (const line of text.split('\n')) {
    const [field, ...value] = line.replace(/#.*/, '').split(':');
    const name = field.trim().toLowerCase();
    const rule = `${name}: ${value.join(':').trim()}`;
    if (name === 'user-agent') {
      if (!group || group.rules.length > 0) {
        group = { agents: [], rules: [] };
        groups.push(group);
      }
      group.agents.push(value.join(':').trim());
    } else if (group && (name === 'allow' || name === 'disallow')) {
      group.rules.push(rule);
    }
  }
  return groups;
}

// The tokens of the AI crawlers each vendor documents, on the pages robots.txt names
// above their groups. OpenAI's OAI-AdsBot is left out: it only visits pages submitted as
// ads on ChatGPT.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'CCBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
];
// Anthropic told 404 Media in July 2024 that these "are no longer in use", and its
// crawler documentation names neither
const RETIRED_TOKENS = ['anthropic-ai', 'claude-web'];

describe('robots.txt', () => {
  it('has a group for every crawler and one for each AI crawler', () => {
    const agents = groupsOf(ROBOTS_TXT).flatMap((group) => group.agents);

    expect([...agents].sort()).toEqual(['*', ...AI_CRAWLERS].sort());
  });

  it('names no crawler by a token its vendor no longer uses', () => {
    // Crawlers match their token without regard to case
    const agents = groupsOf(ROBOTS_TXT).flatMap((group) => group.agents);

    expect(agents.filter((agent) => RETIRED_TOKENS.includes(agent.toLowerCase()))).toEqual([]);
  });

  it('lets every crawler fetch the site', () => {
    const groups = groupsOf(ROBOTS_TXT);

    const closed = groups.filter(
      (group) => !group.rules.includes('allow: /') || group.rules.includes('disallow: /')
    );

    expect(closed.map((group) => group.agents.join(', '))).toEqual([]);
  });

  it('keeps every crawler away from the source maps', () => {
    // The bundles they map stay crawlable: crawlers need them to render the app
    const groups = groupsOf(ROBOTS_TXT);

    const withoutRule = groups.filter((group) => !group.rules.includes('disallow: /*.map$'));

    expect(withoutRule.map((group) => group.agents.join(', '))).toEqual([]);
  });
});
