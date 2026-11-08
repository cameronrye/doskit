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

describe('robots.txt', () => {
  it('has a group for every crawler and one each for the AI crawlers it names', () => {
    const agents = groupsOf(ROBOTS_TXT).flatMap((group) => group.agents);

    expect(agents).toEqual(expect.arrayContaining(['*', 'GPTBot', 'CCBot', 'PerplexityBot']));
  });

  it('keeps every crawler away from the source maps', () => {
    // The bundles they map stay crawlable: crawlers need them to render the app
    const groups = groupsOf(ROBOTS_TXT);

    const withoutRule = groups.filter((group) => !group.rules.includes('disallow: /*.map$'));

    expect(withoutRule.map((group) => group.agents.join(', '))).toEqual([]);
  });
});
