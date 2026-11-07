/**
 * Ends a sentence with a period unless it already has one. Spanish times end in "p. m.", so
 * appending a period blindly would produce "3:00 p. m..".
 */
export function endSentence(text: string): string {
  return text.endsWith('.') ? text : `${text}.`;
}
