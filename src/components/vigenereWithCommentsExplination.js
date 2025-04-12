// VigenereLogic.js - Separate component for Vigenère cipher cracking logic
// This file contains all the cryptanalysis algorithms for breaking Vigenère ciphers

/**
 * VIGENÈRE CIPHER BACKGROUND:
 * ---------------------------
 * The Vigenère cipher is a polyalphabetic substitution cipher that uses a keyword to encrypt text.
 *
 * ENCRYPTION EXAMPLE:
 * Plaintext:  "HELLO"
 * Key:        "KEY" (repeated as "KEYKE")
 *
 * For each letter:
 * H + K (H + 10) = R  (H=7, K=10, 7+10=17 → R)
 * E + E (E + 4)  = I  (E=4, E=4, 4+4=8 → I)
 * L + Y (L + 24) = J  (L=11, Y=24, 11+24=35 mod 26 = 9 → J)
 * L + K (L + 10) = V  (L=11, K=10, 11+10=21 → V)
 * O + E (O + 4)  = S  (O=14, E=4, 14+4=18 → S)
 *
 * Ciphertext: "RIJVS"
 */

// English letter frequencies (most common to least common)
// These values represent the probability of each letter appearing in English text
// Example: 'E' appears in ~12.02% of English text, while 'Z' appears in only ~0.07%
const ENGLISH_FREQUENCIES = {
  E: 0.1202, // Most common letter in English
  T: 0.091,
  A: 0.0812,
  O: 0.0768,
  I: 0.0731,
  N: 0.0695,
  S: 0.0628,
  R: 0.0602,
  H: 0.0592,
  D: 0.0432,
  L: 0.0398,
  U: 0.0288,
  C: 0.0271,
  M: 0.0261,
  F: 0.023,
  Y: 0.0211,
  W: 0.0209,
  G: 0.0203,
  P: 0.0182,
  B: 0.0149,
  V: 0.0111,
  K: 0.0069,
  X: 0.0017,
  Q: 0.0011,
  J: 0.001,
  Z: 0.0007, // Least common letter in English
};

/**
 * Calculates the Index of Coincidence (IC) for a text
 *
 * WHAT IS IC?
 * Index of Coincidence measures the probability that two randomly selected
 * letters from the text are the same. It helps identify whether text is:
 * - Random (IC ≈ 0.038)
 * - Natural language (English IC ≈ 0.067)
 * - Single-substitution cipher (IC similar to natural language)
 * - Polyalphabetic cipher like Vigenère (IC lower than natural language)
 *
 * FORMULA:
 * IC = Σ(n_i × (n_i - 1)) / (N × (N - 1))
 * Where n_i is frequency of each letter and N is total letters
 *
 * KEY TO CRACKING VIGENÈRE:
 * When we split ciphertext by the correct key length, the IC of each sequence
 * approaches that of natural language (~0.067 for English)
 *
 * EXAMPLE:
 * Text: "ABCABC" (key length = 3)
 * - When split into 3 sequences: "AA", "BB", "CC"
 * - Each sequence has high IC (1.0) because same letter repeats
 * - Average IC is high (~1.0)
 *
 * @param {string} text - The text to analyze
 * @return {number} The Index of Coincidence value
 */
const calculateIC = (text) => {
  // Clean the text to only include uppercase letters
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const frequencies = {};
  const length = cleanText.length;

  // Count each letter
  // Example: "HELLO" → {"H": 1, "E": 1, "L": 2, "O": 1}
  for (let i = 0; i < length; i++) {
    // If the letter exists in frequencies, increment it; otherwise, set it to 1
    frequencies[cleanText[i]] = (frequencies[cleanText[i]] || 0) + 1;
  }

  // Calculate IC value using the formula: Σ(n_i × (n_i - 1)) / (N × (N - 1))
  // Example with "HELLO": (1×0 + 1×0 + 2×1 + 1×0) / (5×4) = 2/20 = 0.1
  let sum = 0;
  for (const letter in frequencies) {
    const count = frequencies[letter];
    sum += count * (count - 1); // For each letter, add n_i × (n_i - 1)
  }

  // Avoid division by zero if text is too short
  if (length <= 1) return 0;

  // Return IC value
  return sum / (length * (length - 1));
};

/**
 * Calculates the frequency of each letter in the text
 *
 * Letter frequencies are the cornerstone of cryptanalysis for substitution ciphers.
 * By comparing frequencies in ciphertext to known language frequencies (like English),
 * we can determine the most likely shifts for each letter.
 *
 * EXAMPLE:
 * For "HELLO":
 * - Total letters: 5
 * - H: 1/5 = 0.2 (20%)
 * - E: 1/5 = 0.2 (20%)
 * - L: 2/5 = 0.4 (40%)
 * - O: 1/5 = 0.2 (20%)
 *
 * @param {string} text - The text to analyze
 * @return {Object} Object with letter frequencies (e.g., {'A': 0.1, 'B': 0.05, ...})
 */
const getFrequencies = (text) => {
  const cleanText = text.toUpperCase();
  const frequencies = {};
  let total = 0;

  // Count each letter
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    // Only count alphabetic characters
    if (/[A-Z]/.test(char)) {
      frequencies[char] = (frequencies[char] || 0) + 1;
      total++; // Keep track of total letters for percentage calculation
    }
  }

  // Convert counts to percentages
  // Example: {'H': 1, 'E': 1, 'L': 2, 'O': 1} with total=5
  // → {'H': 0.2, 'E': 0.2, 'L': 0.4, 'O': 0.2}
  for (const letter in frequencies) {
    frequencies[letter] /= total;
  }

  return frequencies;
};

/**
 * Compares letter frequencies to English using Chi-squared test
 *
 * Chi-squared test measures how closely observed frequencies match expected frequencies.
 * Lower values indicate better match to English letter distribution.
 *
 * FORMULA:
 * χ² = Σ((observed - expected)² / expected)
 *
 * EXAMPLE:
 * If in our text 'E' appears 5% of the time (observed=0.05) but in English
 * it should appear 12% (expected=0.12):
 * ((0.05 - 0.12)² / 0.12) = 0.0049/0.12 = 0.04083...
 * We sum these values for all letters A-Z
 *
 * @param {Object} frequencies - Object with observed letter frequencies
 * @return {number} Chi-squared value (lower is better match to English)
 */
const calculateChiSquared = (frequencies) => {
  let chiSquared = 0;
  for (let i = 0; i < 26; i++) {
    // Convert 0-25 to A-Z
    const letter = String.fromCharCode(65 + i); //65+0 = A , 65+1 = C .... so on
    // Get observed frequency (or 0 if not present)
    const observed = frequencies[letter] || 0;
    // Get expected frequency from English distribution
    const expected = ENGLISH_FREQUENCIES[letter] || 0;

    // Only include in calculation if expected > 0 (avoid division by zero)
    if (expected > 0) {
      // Chi-squared formula: (observed - expected)² / expected
      chiSquared += Math.pow(observed - expected, 2) / expected;
    }
  }
  return chiSquared; // Lower is better (more like English)
};

/**
 * Splits text into sequences based on key length
 *
 * This is a crucial step in breaking Vigenère. By splitting the text into sequences
 * where each sequence is encrypted with the same shift (same key letter),
 * we turn a polyalphabetic cipher into multiple simple shift ciphers.
 *
 * EXAMPLE:
 * Text: "HELLOWORLD" with key length 3
 * - Sequence 1: "HLRL" (positions 0,3,6,9)
 * - Sequence 2: "EOO" (positions 1,4,7)
 * - Sequence 3: "LWD" (positions 2,5,8)
 *
 * Each sequence can be analyzed separately using frequency analysis
 *
 * @param {string} text - The text to split
 * @param {number} keyLength - The potential key length to test
 * @return {string[]} Array of sequences
 */
const getSequences = (text, keyLength) => {
  // Create array to hold each sequence
  // Initialize array of keyLength elements, each containing an empty string
  const sequences = Array(keyLength)
    .fill()
    .map(() => "");
  let j = 0; // Counter for alphabet characters only

  // Distribute letters to sequences
  for (let i = 0; i < text.length; i++) {
    // Only process alphabet characters
    if (/[A-Z]/i.test(text[i])) {
      // Position cycles from 0 to (keyLength-1)
      const position = j % keyLength;
      // Add this character to the appropriate sequence
      sequences[position] += text[i];
      j++;
    }
  }

  return sequences;
};

/**
 * Finds possible shifts for each sequence with improved frequency analysis
 *
 * For each possible shift (0-25), this function:
 * 1. Applies the shift to decrypt the sequence
 * 2. Analyzes how English-like the result is
 * 3. Returns the most promising shifts
 *
 * The function uses multiple metrics to determine the best shifts:
 * - Chi-squared test (comparing to English frequencies)
 * - Distribution score (rewarding presence of common English letters)
 * - Combined score balancing both metrics
 *
 * EXAMPLE:
 * For sequence "RIJVS", trying shift=10 (key letter 'K'):
 * - Decrypts to "HELLO"
 * - Frequencies match English better than other shifts
 * - Returns 10 as one of the best shifts
 *
 * @param {string} sequence - Single sequence to analyze
 * @param {number} numOptions - Number of best shifts to return
 * @return {number[]} Array of most likely shift values
 */
const findBestShifts = (sequence, numOptions = 8) => {
  const results = [];

  // Try all 26 possible shifts (A-Z)
  for (let shift = 0; shift < 26; shift++) {
    let decrypted = "";

    // Apply this shift to each character in the sequence
    // For Vigenère decryption: P = (C - K + 26) % 26 where P=plaintext, C=ciphertext, K=key
    for (let i = 0; i < sequence.length; i++) {
      const char = sequence[i];
      const code = char.charCodeAt(0);

      // Handle uppercase letters (ASCII 65-90)
      if (code >= 65 && code <= 90) {
        // Formula: ((code - 65 - shift + 26) % 26) + 65
        // 1. code - 65: Convert ASCII to 0-25 range
        // 2. - shift: Apply the reverse shift
        // 3. + 26 % 26: Ensure result is positive and in range 0-25
        // 4. + 65: Convert back to ASCII uppercase
        decrypted += String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
      }
      // Handle lowercase letters (ASCII 97-122)
      else if (code >= 97 && code <= 122) {
        // Same formula but adjusted for lowercase ASCII range
        decrypted += String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
      }
      // Keep non-alphabetic characters unchanged
      else {
        decrypted += char;
      }
    }

    // Calculate how similar to English using multiple metrics
    const frequencies = getFrequencies(decrypted);
    const chiSquared = calculateChiSquared(frequencies);

    // Calculate letter distribution score - a custom metric that rewards text
    // containing common English letters in appropriate proportions
    let distributionScore = 0;
    for (const letter in ENGLISH_FREQUENCIES) {
      if (frequencies[letter]) {
        // Reward presence of common letters
        // Higher score for more frequent letters in English
        // Example: 'E' (freq=0.12) contributes more than 'Z' (freq=0.0007)
        distributionScore +=
          frequencies[letter] * ENGLISH_FREQUENCIES[letter] * 100;
      }
    }

    // Combined score balances chi-squared (lower is better) with distribution score (higher is better)
    // The negative weight on distributionScore is because we want to minimize the combinedScore
    const combinedScore = chiSquared - distributionScore * 0.5;

    // Store results for this shift
    results.push({ shift, chiSquared, distributionScore, combinedScore });
  }

  // Return top shifts (sorted by combined metric - lower is better)
  results.sort((a, b) => a.combinedScore - b.combinedScore);
  return results.slice(0, numOptions).map((r) => r.shift);
};

/**
 * Converts shifts to a key string
 *
 * Transforms numeric shift values to their corresponding letters
 *
 * EXAMPLE:
 * Shifts [10, 4, 24] -> "KEY"
 * Because:
 * - 10 corresponds to 'K' (A + 10 = K)
 * - 4 corresponds to 'E' (A + 4 = E)
 * - 24 corresponds to 'Y' (A + 24 = Y)
 *
 * @param {number[]} shifts - Array of shift values (0-25)
 * @return {string} The corresponding key string
 */
const shiftsToKey = (shifts) => {
  return shifts.map((shift) => String.fromCharCode(shift + 65)).join("");
};

/**
 * Decrypts text with a given key
 *
 * This is the core Vigenère decryption algorithm:
 * P = (C - K + 26) % 26
 * Where P = plaintext, C = ciphertext, K = key
 *
 * EXAMPLE:
 * Ciphertext: "RIJVS", Key: "KEY"
 * R - K = 17 - 10 = 7 → H
 * I - E = 8 - 4 = 4 → E
 * J - Y = 9 - 24 + 26 = 11 → L
 * V - K = 21 - 10 = 11 → L
 * S - E = 18 - 4 = 14 → O
 * Plaintext: "HELLO"
 *
 * @param {string} text - The ciphertext to decrypt
 * @param {string} key - The decryption key
 * @return {string} The decrypted text
 */
const decryptWithKey = (text, key) => {
  if (!key) return text;

  const upperKey = key.toUpperCase();
  let result = "";
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Only process alphabet characters
    if (char.match(/[a-z]/i)) {
      // Preserve case
      const isUpperCase = char === char.toUpperCase();

      // Convert to 0-25 range (A=0, B=1, ..., Z=25)
      const charCode = char.toUpperCase().charCodeAt(0) - 65;

      // Get the corresponding key character, wrapping around if key is shorter than text
      const keyChar = upperKey[keyIndex % upperKey.length];
      const keyCode = keyChar.charCodeAt(0) - 65;

      // Apply Vigenère decryption formula: (cipherChar - keyChar + 26) % 26
      // The +26 ensures the result is positive before the modulo operation
      let decryptedCode = (charCode - keyCode + 26) % 26;

      // Convert back to a character (A-Z)
      let decryptedChar = String.fromCharCode(decryptedCode + 65);

      // Restore original case
      if (!isUpperCase) {
        decryptedChar = decryptedChar.toLowerCase();
      }

      result += decryptedChar;
      keyIndex++; // Move to next key character only for alphabet characters
    } else {
      result += char; // Keep non-alphabetic characters unchanged
    }
  }

  return result;
};

/**
 * Counts recognized English words in text
 *
 * This function splits text into words and checks each against a dictionary.
 * It calculates:
 * - How many words were recognized
 * - What percentage of total words were recognized
 * - A weighted score that gives more importance to longer words
 *
 * EXAMPLE:
 * Text: "the quick brown fox"
 * If dictionary contains "the", "quick", and "fox" but not "brown":
 * - Recognized: 3
 * - Total: 4
 * - Percentage: 75%
 *
 * @param {string} text - The text to analyze
 * @param {Object} dictionary - Dictionary object with words as keys
 * @return {Object} Statistics about word recognition
 */
const countRecognizedWords = (text, dictionary) => {
  // Split text into words (any non-alphabetic character is a delimiter)
  const words = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 0); // Remove empty strings

  let recognizedCount = 0;
  let totalWeight = 0;

  // Check each word against the dictionary
  for (const word of words) {
    // Only consider words with at least 2 letters
    if (word.length >= 2) {
      const wordWeight = dictionary[word];
      if (wordWeight) {
        recognizedCount++;
        totalWeight += wordWeight; // Add word's weight to total
      }
    }
  }

  // Calculate percentage of recognized words
  const percentage =
    words.length > 0 ? (recognizedCount / words.length) * 100 : 0;

  // Calculate weighted score (gives higher importance to longer/common words)
  const weightedScore = words.length > 0 ? totalWeight / words.length : 0;

  return {
    count: recognizedCount,
    total: words.length,
    percentage,
    weightedScore,
  };
};

/**
 * Tries variations of a key to improve it
 *
 * This is an optimization function that:
 * 1. Starts with an initial key
 * 2. Makes small changes to the key and tests if they improve decryption
 * 3. Repeats until target recognition percentage is reached or max iterations
 *
 * The algorithm uses several strategies:
 * - Systematically trying different letters for each position
 * - Swapping adjacent letters when progress stalls
 * - Random mutations when other methods fail
 *
 * EXAMPLE:
 * Starting key: "KAY"
 * - Tests "AAY", "BAY", ... "ZAY" (changing first letter)
 * - Tests "KBY", "KCY", ... "KZY" (changing second letter)
 * - If "KEY" gives better results, it becomes the new current key
 *
 * @param {string} initialKey - Starting key to refine
 * @param {string} ciphertext - The encrypted text
 * @param {Object} dictionary - Dictionary for word recognition
 * @param {number} targetPercentage - Target word recognition percentage
 * @param {number} maxIters - Maximum iterations to attempt
 * @param {Function} progressCallback - Callback for progress updates
 * @return {Object} Results including final key and stats
 */
const refineKey = (
  initialKey,
  ciphertext,
  dictionary,
  targetPercentage,
  maxIters,
  progressCallback
) => {
  // Initialize with the starting key
  let bestKey = initialKey;
  let bestDecrypted = decryptWithKey(ciphertext, bestKey);
  let bestWordStats = countRecognizedWords(bestDecrypted, dictionary);
  let bestScore = bestWordStats.percentage;
  let iterations = 0;
  let improved = false;
  let lastImprovedIteration = 0;

  // Continue refining until we reach target or max iterations
  // Add a stagnation check: if no improvement in last 10 iterations, try more aggressive changes
  while (
    (bestScore < targetPercentage && iterations < maxIters) ||
    (iterations < maxIters && iterations - lastImprovedIteration < 10)
  ) {
    iterations++;

    // Report progress if callback provided
    if (progressCallback) {
      progressCallback(
        `Refining key (iteration ${iterations}/${maxIters}). Current recognition: ${bestScore.toFixed(
          2
        )}%`
      );
    }

    let foundBetter = false;

    // Stagnation strategy: if stuck for a while, make more dramatic changes
    const stagnating = iterations - lastImprovedIteration > 5;

    // Try changing one letter at a time
    for (let pos = 0; pos < bestKey.length; pos++) {
      // Random shuffling of shifts to prevent getting stuck in local maxima
      // This creates array [0,1,2,...,25] and shuffles it randomly
      const shiftOrder = Array.from({ length: 26 }, (_, i) => i);
      for (let i = shiftOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shiftOrder[i], shiftOrder[j]] = [shiftOrder[j], shiftOrder[i]];
      }

      // Try each possible letter (in random order)
      for (const shift of shiftOrder) {
        // Skip current letter (no need to test the same letter)
        if (bestKey.charCodeAt(pos) - 65 === shift) continue;

        // Create new key with this letter changed
        // Example: If bestKey="KEY" and pos=1, shift=0, newKey becomes "KAY"
        const newKey =
          bestKey.substring(0, pos) +
          String.fromCharCode(65 + shift) +
          bestKey.substring(pos + 1);

        // Test this key
        const decrypted = decryptWithKey(ciphertext, newKey);
        const wordStats = countRecognizedWords(decrypted, dictionary);

        // If this key is better than our current best, update it
        if (wordStats.percentage > bestScore) {
          bestKey = newKey;
          bestScore = wordStats.percentage;
          bestDecrypted = decrypted;
          bestWordStats = wordStats;
          foundBetter = true;
          improved = true;
          lastImprovedIteration = iterations;
          break; // Exit the shift loop, we found a better key
        }
      }

      // If we found a better key, start over with the new key
      if (foundBetter) break;

      // If stagnating, try swapping adjacent letters
      // Example: "KEY" → "KYE" (swap E and Y)
      if (stagnating && pos < bestKey.length - 1) {
        const swappedKey =
          bestKey.substring(0, pos) +
          bestKey.charAt(pos + 1) +
          bestKey.charAt(pos) +
          bestKey.substring(pos + 2);

        const decrypted = decryptWithKey(ciphertext, swappedKey);
        const wordStats = countRecognizedWords(decrypted, dictionary);

        if (wordStats.percentage > bestScore) {
          bestKey = swappedKey;
          bestScore = wordStats.percentage;
          bestDecrypted = decrypted;
          bestWordStats = wordStats;
          foundBetter = true;
          improved = true;
          lastImprovedIteration = iterations;
          break;
        }
      }
    }

    // If stuck, try random changes
    if (!foundBetter) {
      // As we get more stuck, make more dramatic changes
      // Number of characters to change increases the longer we're stuck
      const changeCount = Math.min(
        Math.floor((iterations - lastImprovedIteration) / 3) + 1,
        Math.floor(bestKey.length / 2)
      );

      let newKey = bestKey;
      // Make multiple random changes
      for (let i = 0; i < changeCount; i++) {
        const pos = Math.floor(Math.random() * newKey.length);
        const randomShift = Math.floor(Math.random() * 26);
        newKey =
          newKey.substring(0, pos) +
          String.fromCharCode(65 + randomShift) +
          newKey.substring(pos + 1);
      }

      const decrypted = decryptWithKey(ciphertext, newKey);
      const wordStats = countRecognizedWords(decrypted, dictionary);

      if (wordStats.percentage > bestScore) {
        bestKey = newKey;
        bestScore = wordStats.percentage;
        bestDecrypted = decrypted;
        bestWordStats = wordStats;
        improved = true;
        lastImprovedIteration = iterations;
      }
    }

    // If we reach the target, break
    if (bestScore >= targetPercentage) {
      break;
    }
  }

  // Return results
  return {
    finalKey: bestKey,
    improved,
    iterations,
    wordStats: bestWordStats,
    decrypted: bestDecrypted,
  };
};

/**
 * Generates possible keys from shift options
 *
 * This function takes arrays of possible shifts for each position in the key
 * and generates all possible combinations.
 *
 * EXAMPLE:
 * shiftOptions = [[10,11], [4,5], [24,25]]
 * Generates keys: "KEY", "KEZ", "KFY", "KFZ", "LEY", "LEZ", "LFY", "LFZ"
 *
 * @param {number[][]} shiftOptions - Arrays of possible shifts for each position
 * @return {string[]} Array of possible keys
 */
const generateKeys = (shiftOptions) => {
  // Start with first letter options
  // Convert shifts to arrays of single shifts
  // Example: shiftOptions[0] = [10,11] becomes combinations = [[10], [11]]
  let combinations = shiftOptions[0].map((shift) => [shift]);

  // Add each subsequent letter's options
  for (let i = 1; i < shiftOptions.length; i++) {
    const newCombinations = [];

    // For each existing partial combination
    for (const combo of combinations) {
      // For each possible shift at this position
      for (const shift of shiftOptions[i]) {
        // Add this shift to create a new combination
        // Example: combo=[10], shift=4 creates newCombo=[10,4]
        newCombinations.push([...combo, shift]);
      }
    }

    combinations = newCombinations;

    // Limit number of combinations to prevent memory overload
    // If we have too many possibilities, just take the first 500
    if (combinations.length > 500) {
      combinations = combinations.slice(0, 500);
    }
  }

  // Convert shift arrays to key strings
  // Example: [10,4,24] becomes "KEY"
  return combinations.map((shifts) => shiftsToKey(shifts));
};

/**
 * Rates the quality of a key based on multiple factors
 *
 * This creates a comprehensive score that considers:
 * - Word recognition (percentage of recognized words)
 * - Weighted word score (giving more weight to longer/common words)
 * - Letter frequency (chi-squared comparison to English)
 *
 * EXAMPLE:
 * Key "KEY" might have:
 * - Word recognition: 85%
 * - Weighted score: 4.2
 * - Chi-squared: 0.15
 * Resulting in composite score = 85*0.7 + 4.2*15 - 0.15*0.2 = 122.2
 *
 * @param {string} key - The key to evaluate
 * @param {string} ciphertext - The encrypted text
 * @param {Object} dictionary - Dictionary for word recognition
 * @return {Object} Rating info including scores and decrypted text
 */
const rateKeyQuality = (key, ciphertext, dictionary) => {
  // Decrypt with this key
  const decrypted = decryptWithKey(ciphertext, key);

  // Check how many English words we can recognize
  const wordStats = countRecognizedWords(decrypted, dictionary);

  // Compare letter distribution to English
  const frequencies = getFrequencies(decrypted);
  const chiSquared = calculateChiSquared(frequencies);

  // Calculate composite score using weighted factors:
  // - Word recognition is most important (weight 0.7)
  // - Weighted word score adds nuance (weight 15)
  // - Chi-squared slightly reduces score for non-English-like distribution (weight -0.2)
  const compositeScore =
    wordStats.percentage * 0.7 +
    wordStats.weightedScore * 15 -
    chiSquared * 0.2;

  return {
    key,
    decrypted,
    wordStats,
    chiSquared,
    compositeScore,
  };
};

// Export all the necessary functions
export {
  calculateIC,
  getFrequencies,
  calculateChiSquared,
  getSequences,
  findBestShifts,
  shiftsToKey,
  decryptWithKey,
  countRecognizedWords,
  refineKey,
  generateKeys,
  rateKeyQuality,
  ENGLISH_FREQUENCIES,
};
