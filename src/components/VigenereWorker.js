// VigenereWorker.js - Web Worker for parallel processing of key candidates

// Import is not available in web workers, so we'll redefine the necessary functions
const ENGLISH_FREQUENCIES = {
  E: 0.1202,
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
  Z: 0.0007,
};

// Calculate frequency of each letter in the text
function getFrequencies(text) {
  const cleanText = text.toUpperCase();
  const frequencies = {};
  let total = 0;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (/[A-Z]/.test(char)) {
      frequencies[char] = (frequencies[char] || 0) + 1;
      total++;
    }
  }

  // Convert counts to percentages
  for (const letter in frequencies) {
    frequencies[letter] /= total;
  }

  return frequencies;
}

// Compare letter frequencies to English using Chi-squared test
function calculateChiSquared(frequencies) {
  let chiSquared = 0;
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    const observed = frequencies[letter] || 0;
    const expected = ENGLISH_FREQUENCIES[letter] || 0;
    if (expected > 0) {
      chiSquared += Math.pow(observed - expected, 2) / expected;
    }
  }
  return chiSquared; // Lower is better (more like English)
}

// Decrypt text with a given key
function decryptWithKey(text, key) {
  if (!key) return text;

  const upperKey = key.toUpperCase();
  let result = "";
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-z]/i)) {
      const isUpperCase = char === char.toUpperCase();
      const charCode = char.toUpperCase().charCodeAt(0) - 65;
      const keyChar = upperKey[keyIndex % upperKey.length];
      const keyCode = keyChar.charCodeAt(0) - 65;

      let decryptedCode = (charCode - keyCode + 26) % 26;
      let decryptedChar = String.fromCharCode(decryptedCode + 65);

      if (!isUpperCase) {
        decryptedChar = decryptedChar.toLowerCase();
      }

      result += decryptedChar;
      keyIndex++;
    } else {
      result += char;
    }
  }

  return result;
}

// Count recognized English words in text
function countRecognizedWords(text, dictionary) {
  const words = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 0);

  let recognizedCount = 0;
  let totalWeight = 0;

  for (const word of words) {
    if (word.length >= 2) {
      const wordWeight = dictionary[word];
      if (wordWeight) {
        recognizedCount++;
        totalWeight += wordWeight;
      }
    }
  }

  const percentage =
    words.length > 0 ? (recognizedCount / words.length) * 100 : 0;
  const weightedScore = words.length > 0 ? totalWeight / words.length : 0;

  return {
    count: recognizedCount,
    total: words.length,
    percentage,
    weightedScore,
  };
}

// Optimize a key to improve word recognition
function refineKey(
  initialKey,
  ciphertext,
  dictionary,
  targetPercentage,
  maxIters
) {
  let bestKey = initialKey;
  let bestDecrypted = decryptWithKey(ciphertext, bestKey);
  let bestWordStats = countRecognizedWords(bestDecrypted, dictionary);
  let bestScore = bestWordStats.percentage;
  let iterations = 0;
  let improved = false;
  let lastImprovedIteration = 0;
  const progressUpdates = [];

  // Continue refining until we reach target or max iterations
  while (
    (bestScore < targetPercentage && iterations < maxIters) ||
    (iterations < maxIters && iterations - lastImprovedIteration < 10)
  ) {
    iterations++;

    if (iterations % 5 === 0) {
      progressUpdates.push({
        iteration: iterations,
        score: bestScore,
        key: bestKey,
      });
    }

    let foundBetter = false;
    const stagnating = iterations - lastImprovedIteration > 5;

    // Try changing one letter at a time
    for (let pos = 0; pos < bestKey.length; pos++) {
      const shiftOrder = Array.from({ length: 26 }, (_, i) => i);
      for (let i = shiftOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shiftOrder[i], shiftOrder[j]] = [shiftOrder[j], shiftOrder[i]];
      }

      for (const shift of shiftOrder) {
        if (bestKey.charCodeAt(pos) - 65 === shift) continue;

        const newKey =
          bestKey.substring(0, pos) +
          String.fromCharCode(65 + shift) +
          bestKey.substring(pos + 1);

        const decrypted = decryptWithKey(ciphertext, newKey);
        const wordStats = countRecognizedWords(decrypted, dictionary);

        if (wordStats.percentage > bestScore) {
          bestKey = newKey;
          bestScore = wordStats.percentage;
          bestDecrypted = decrypted;
          bestWordStats = wordStats;
          foundBetter = true;
          improved = true;
          lastImprovedIteration = iterations;
          break;
        }
      }

      if (foundBetter) break;

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

    if (!foundBetter) {
      const changeCount = Math.min(
        Math.floor((iterations - lastImprovedIteration) / 3) + 1,
        Math.floor(bestKey.length / 2)
      );

      let newKey = bestKey;
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

    if (bestScore >= targetPercentage) {
      break;
    }
  }

  return {
    finalKey: bestKey,
    improved,
    iterations,
    wordStats: bestWordStats,
    decrypted: bestDecrypted,
    progressUpdates,
  };
}

// Process key candidates
function processKeyCandidates(
  keyCandidates,
  ciphertext,
  dictionary,
  targetPercentage,
  maxIterations
) {
  const results = keyCandidates.map((key) => {
    const decrypted = decryptWithKey(ciphertext, key);
    const initialWordStats = countRecognizedWords(decrypted, dictionary);

    // Check if refinement is needed
    if (initialWordStats.percentage >= targetPercentage) {
      return {
        key,
        decrypted,
        wordStats: initialWordStats,
        refined: false,
        iterations: 0,
      };
    }

    // Refine the key
    const refinementResult = refineKey(
      key,
      ciphertext,
      dictionary,
      targetPercentage,
      maxIterations
    );

    return {
      key: refinementResult.finalKey,
      decrypted: refinementResult.decrypted,
      wordStats: refinementResult.wordStats,
      refined: refinementResult.improved,
      iterations: refinementResult.iterations,
      progressUpdates: refinementResult.progressUpdates,
    };
  });

  return results;
}

// Process brute force keys
function processBruteForceKeys(keys, ciphertext, dictionary) {
  return keys.map((key) => {
    const decrypted = decryptWithKey(ciphertext, key);
    const wordStats = countRecognizedWords(decrypted, dictionary);

    // Calculate additional metrics for better evaluation
    const frequencies = getFrequencies(decrypted);
    const chiSquared = calculateChiSquared(frequencies);

    return {
      key,
      decrypted,
      wordStats,
      chiSquared,
    };
  });
}

// Handle messages from the main thread
self.onmessage = function (e) {
  const { type, data } = e.data;

  switch (type) {
    case "processCandidates":
      const {
        candidates,
        ciphertext,
        dictionary,
        targetPercentage,
        maxIterations,
      } = data;
      const results = processKeyCandidates(
        candidates,
        ciphertext,
        dictionary,
        targetPercentage,
        maxIterations
      );
      self.postMessage({ type: "candidatesResult", results });
      break;

    case "processBruteForce":
      const { keys, bruteForceText, bruteForceDict } = data;
      const bruteForceResults = processBruteForceKeys(
        keys,
        bruteForceText,
        bruteForceDict
      );
      self.postMessage({
        type: "bruteForceResult",
        results: bruteForceResults,
      });
      break;

    case "refineKey":
      const { key, refineText, refineDict, refineTarget, refineMaxIter } = data;
      const refinementResult = refineKey(
        key,
        refineText,
        refineDict,
        refineTarget,
        refineMaxIter
      );
      self.postMessage({ type: "refineResult", result: refinementResult });
      break;
  }
};
