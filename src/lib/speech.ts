
'use client';

const numberMap: { [key: string]: number } = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000,
};

// A simplified parser for spoken numbers.
// This is not exhaustive and has limitations (e.g., doesn't handle "one hundred and twenty three" well).
// It primarily focuses on digits and simple number words.
export function parseSpokenNumber(spokenText: string): number | null {
  if (!spokenText) return null;

  const cleanedText = spokenText.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, ''); // Remove punctuation except hyphens

  // Try direct integer parsing first
  const directNumber = parseInt(cleanedText, 10);
  if (!isNaN(directNumber)) {
    return directNumber;
  }

  // Try mapping simple words
  if (cleanedText in numberMap) {
    return numberMap[cleanedText];
  }
  
  const words = cleanedText.split(/[\s-]+/); // Split by space or hyphen
  let total = 0;
  let currentNumber = 0;

  for (const word of words) {
    if (word in numberMap) {
      const value = numberMap[word];
      if (value === 100) { // "hundred"
        currentNumber *= value;
      } else if (value === 1000) { // "thousand"
        currentNumber *= value;
        total += currentNumber;
        currentNumber = 0;
      } else if (value < 20 || (value % 10 === 0 && value < 100)) { // Single digits, teens, tens
         if (currentNumber > 0 && currentNumber < 10 && value > currentNumber && value < 10) { // e.g. "five six" for 56 - this logic is tricky
            currentNumber = currentNumber * 10 + value;
         } else if (currentNumber >= 20 && value < 10) { // e.g. "twenty one"
            currentNumber += value;
         }
         else {
            currentNumber += value;
         }
      } else {
         // More complex logic needed for numbers like "one twenty three" -> 123
         // For now, this will likely fail or produce incorrect results for such cases.
         // If the current number forms a unit like "twenty" and the next is "one", it's handled above.
         // Otherwise, we might just add, which could be wrong.
         // This part is intentionally kept simple.
         if (currentNumber > 0 && value < 10) { // Heuristic: if we have a number and then a digit, maybe it's like "five six" for 56
             currentNumber = currentNumber * 10 + value;
         } else {
            total += currentNumber; // Add previous segment
            currentNumber = value;  // Start new segment
         }
      }
    } else {
        const digit = parseInt(word, 10);
        if (!isNaN(digit)) {
             if (currentNumber > 0 && currentNumber < 10 && digit < 10) {
                currentNumber = currentNumber * 10 + digit;
             } else if (currentNumber >= 10 && digit < 10) {
                 currentNumber += digit; // This might be for "twenty 3" -> 23
             }
             else {
                total += currentNumber;
                currentNumber = digit;
             }
        } else {
            // Word not recognized as a number or digit
            // If part of a number was parsed, return that. Otherwise, fail.
             if (words.length > 1 && (total > 0 || currentNumber > 0) ) { 
                // Heuristic: if we parsed something and encounter a non-number,
                // assume the number part ended.
                break; 
            }
            return null; // Completely unparseable word
        }
    }
  }
  total += currentNumber;

  return total > 0 || cleanedText === "zero" || cleanedText === "0" ? total : null;
}

// Example Usage:
// console.log(parseSpokenNumber("5")); // 5
// console.log(parseSpokenNumber("five")); // 5
// console.log(parseSpokenNumber("twelve")); // 12
// console.log(parseSpokenNumber("twenty")); // 20
// console.log(parseSpokenNumber("twenty-five")); // 25
// console.log(parseSpokenNumber("twenty five")); // 25
// console.log(parseSpokenNumber("one hundred")); // 100
// console.log(parseSpokenNumber("fifty six")); // 56 (might work with improved logic)
// console.log(parseSpokenNumber("hello")); // null
// console.log(parseSpokenNumber("two three")); // 23 (might work)
// console.log(parseSpokenNumber("two hundred thirty five")); // might work if logic is expanded for "and" etc.
// console.log(parseSpokenNumber("0")); // 0
// console.log(parseSpokenNumber("zero")); // 0

