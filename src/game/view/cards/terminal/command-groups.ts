import type { TermText } from '@/copy';

const WORD = /(?:'[^']*'|\\.|\$\([^)]*\)|\{\{.*?\}\}|\[\[.*?\]\]|\S)+/g;
const OPTIONS_WITH_VALUE: ReadonlySet<string> = new Set(['-u', '-b', '-X', '-d', '-w', '-t', '--connect-timeout']);
const URL_PATH = /^'?[a-z][a-z\d+.-]*:\/\/[^/?#]*(\/[^?#]*)?/i;

function joinsTheWordBefore(before: string, word: string): boolean {
  return OPTIONS_WITH_VALUE.has(before) || (word.startsWith('-') && !OPTIONS_WITH_VALUE.has(word));
}

function breakAfterThePath(group: string): string[] {
  const path = URL_PATH.exec(group);
  if (path?.[1] === undefined) return [group];
  const cut = path[0].lastIndexOf('/') + 1;
  return cut < group.length ? [group.slice(0, cut), group.slice(cut)] : [group];
}

/** Takes the line a terminal shows for the picks; returns its groups, each a list of parts that never break inside. The line breaks only between groups, which are its shell words (a quoted word, a `$( )` and a tag are one word), except that a flag without a value (`-i`) stays with the word before it and an option that takes a value (`-X PUT`) with its value. A group that is a url also breaks after the last slash of its path, so the break before `http://` is the one between groups. Joined with a space between the groups, the parts give the line back. */
export function commandGroups(line: TermText): string[][] {
  const groups: string[] = [];
  let before = '';
  for (const [word] of line.matchAll(WORD)) {
    if (groups.length > 0 && joinsTheWordBefore(before, word)) groups[groups.length - 1] += ` ${word}`;
    else groups.push(word);
    before = word;
  }
  return groups.map(breakAfterThePath);
}
