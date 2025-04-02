import React, { useState, useEffect } from "react";
import "../styles/Vegenire.module.css";
import Data from "./Words.json";
import VKData from "./VK.json"; // Import the VK.json file with keys

export default function VCracker() {
  // State variables
  const [ciphertext, setCiphertext] = useState("");
  const [key, setKey] = useState("");
  const [useKey, setUseKey] = useState(false);
  const [maxKeyLength, setMaxKeyLength] = useState(10);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dictionary, setDictionary] = useState({});
  const [decryptedText, setDecryptedText] = useState("");
  const [targetRecognition, setTargetRecognition] = useState(90);
  const [maxIterations, setMaxIterations] = useState(25);
  const [useBruteForce, setUseBruteForce] = useState(false); // Add brute force option
  const [bruteForceKeys, setBruteForceKeys] = useState([]); // Store VK keys

  // Load dictionary and brute force keys on component mount
  useEffect(() => {
    // Load words dictionary
    const commonWords = Data.commonWords || [];
    const dict = {};

    commonWords.forEach((word, index) => {
      // Give higher weights to longer words and more common words
      let weight = 1.0;
      if (word.length > 2) weight += (word.length - 2) * 0.3;
      if (index < 500) weight += 0.8;
      dict[word] = weight;
    });

    setDictionary(dict);

    // Load brute force keys
    if (VKData && VKData.keys) {
      setBruteForceKeys(VKData.keys);
    }
  }, []);

  // English letter frequencies (most common to least common)
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

  // Calculate Index of Coincidence (helps determine key length)
  const calculateIC = (text) => {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
    const frequencies = {};
    const length = cleanText.length;

    // Count each letter
    for (let i = 0; i < length; i++) {
      frequencies[cleanText[i]] = (frequencies[cleanText[i]] || 0) + 1;
    }

    // Calculate IC value
    let sum = 0;
    for (const letter in frequencies) {
      const count = frequencies[letter];
      sum += count * (count - 1);
    }

    if (length <= 1) return 0;
    return sum / (length * (length - 1));
  };

  // Calculate frequency of each letter in the text
  const getFrequencies = (text) => {
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
  };

  // Compare letter frequencies to English using Chi-squared test
  const calculateChiSquared = (frequencies) => {
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
  };

  // Split text into sequences based on key length
  const getSequences = (text, keyLength) => {
    // Create array to hold each sequence
    const sequences = Array(keyLength)
      .fill()
      .map(() => "");
    let j = 0;

    // Distribute letters to sequences
    for (let i = 0; i < text.length; i++) {
      if (/[A-Z]/i.test(text[i])) {
        const position = j % keyLength;
        sequences[position] += text[i];
        j++;
      }
    }

    return sequences;
  };

  // Find possible shifts for each sequence
  const findBestShifts = (sequence, numOptions = 5) => {
    const results = [];

    // Try all 26 possible shifts
    for (let shift = 0; shift < 26; shift++) {
      let decrypted = "";
      // Apply this shift to each character
      for (let i = 0; i < sequence.length; i++) {
        const char = sequence[i];
        const code = char.charCodeAt(0);

        if (code >= 65 && code <= 90) {
          // Uppercase
          decrypted += String.fromCharCode(
            ((code - 65 - shift + 26) % 26) + 65
          );
        } else if (code >= 97 && code <= 122) {
          // Lowercase
          decrypted += String.fromCharCode(
            ((code - 97 - shift + 26) % 26) + 97
          );
        } else {
          decrypted += char;
        }
      }

      // Calculate how similar to English
      const frequencies = getFrequencies(decrypted);
      const chiSquared = calculateChiSquared(frequencies);
      results.push({ shift, chiSquared });
    }

    // Return top shifts (sorted by most like English)
    results.sort((a, b) => a.chiSquared - b.chiSquared);
    return results.slice(0, numOptions).map((r) => r.shift);
  };

  // Convert shifts to a key string
  const shiftsToKey = (shifts) => {
    return shifts.map((shift) => String.fromCharCode(shift + 65)).join("");
  };

  // Decrypt text with a given key
  const decryptWithKey = (text, key) => {
    if (!key) return text;

    const upperKey = key.toUpperCase();
    let result = "";
    let keyIndex = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char.match(/[a-z]/i)) {
        const isUpperCase = char === char.toUpperCase();
        // Convert to 0-25 range
        const charCode = char.toUpperCase().charCodeAt(0) - 65;
        const keyChar = upperKey[keyIndex % upperKey.length];
        const keyCode = keyChar.charCodeAt(0) - 65;

        // Apply Vigenère decryption formula
        let decryptedCode = (charCode - keyCode + 26) % 26;
        let decryptedChar = String.fromCharCode(decryptedCode + 65);

        if (!isUpperCase) {
          decryptedChar = decryptedChar.toLowerCase();
        }

        result += decryptedChar;
        keyIndex++;
      } else {
        result += char; // Keep non-alphabetic characters
      }
    }

    return result;
  };

  // Count recognized English words in text
  const countRecognizedWords = (text) => {
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
  };

  // Try variations of a key to improve it
  const refineKey = (initialKey, targetPercentage, maxIters) => {
    let bestKey = initialKey;
    let bestDecrypted = decryptWithKey(ciphertext, bestKey);
    let bestWordStats = countRecognizedWords(bestDecrypted);
    let bestScore = bestWordStats.percentage;
    let iterations = 0;
    let improved = false;

    // Continue refining until we reach target or max iterations
    while (bestScore < targetPercentage && iterations < maxIters) {
      iterations++;
      setResult(
        `Refining key (iteration ${iterations}/${maxIters}). Current recognition: ${bestScore.toFixed(
          2
        )}%`
      );
      let foundBetter = false;

      // Try changing one letter at a time
      for (let pos = 0; pos < bestKey.length; pos++) {
        for (let shift = 0; shift < 26; shift++) {
          // Skip current letter
          if (bestKey.charCodeAt(pos) - 65 === shift) continue;

          // Create new key with this letter changed
          const newKey =
            bestKey.substring(0, pos) +
            String.fromCharCode(65 + shift) +
            bestKey.substring(pos + 1);

          // Test this key
          const decrypted = decryptWithKey(ciphertext, newKey);
          const wordStats = countRecognizedWords(decrypted);

          if (wordStats.percentage > bestScore) {
            bestKey = newKey;
            bestScore = wordStats.percentage;
            bestDecrypted = decrypted;
            bestWordStats = wordStats;
            foundBetter = true;
            improved = true;
            break;
          }
        }
        if (foundBetter) break;
      }

      // If stuck, try random changes
      if (!foundBetter && iterations % 3 === 0) {
        const pos = Math.floor(Math.random() * bestKey.length);
        const randomShift = Math.floor(Math.random() * 26);
        const newKey =
          bestKey.substring(0, pos) +
          String.fromCharCode(65 + randomShift) +
          bestKey.substring(pos + 1);

        const decrypted = decryptWithKey(ciphertext, newKey);
        const wordStats = countRecognizedWords(decrypted);

        if (wordStats.percentage > bestScore) {
          bestKey = newKey;
          bestScore = wordStats.percentage;
          bestDecrypted = decrypted;
          bestWordStats = wordStats;
          improved = true;
        }
      }
    }

    return {
      finalKey: bestKey,
      improved,
      iterations,
      wordStats: bestWordStats,
      decrypted: bestDecrypted,
    };
  };

  // Generate possible keys from shift options
  const generateKeys = (shiftOptions) => {
    // Start with first letter options
    let combinations = shiftOptions[0].map((shift) => [shift]);

    // Add each subsequent letter's options
    for (let i = 1; i < shiftOptions.length; i++) {
      const newCombinations = [];
      for (const combo of combinations) {
        for (const shift of shiftOptions[i]) {
          newCombinations.push([...combo, shift]);
        }
      }
      combinations = newCombinations;

      // Limit number of combinations to prevent overload
      if (combinations.length > 300) {
        combinations = combinations.slice(0, 300);
      }
    }

    // Convert shift arrays to key strings
    return combinations.map((shifts) => shiftsToKey(shifts));
  };

  // New function to try brute force keys from VK.json
  const tryBruteForceKeys = () => {
    if (bruteForceKeys.length === 0) {
      setResult("No brute force keys available.");
      return null;
    }

    setResult(`Testing ${bruteForceKeys.length} predefined keys...`);

    // Store results for each key
    const results = [];

    // Try each key
    for (let i = 0; i < bruteForceKeys.length; i++) {
      const testKey = bruteForceKeys[i];

      // Skip empty or invalid keys
      if (!testKey || testKey.length === 0) continue;

      const decrypted = decryptWithKey(ciphertext, testKey);
      const wordStats = countRecognizedWords(decrypted);

      // Store result
      results.push({
        key: testKey,
        wordStats,
        decrypted,
      });

      // Update progress periodically (every 20 keys or for the last key)
      if (i % 20 === 0 || i === bruteForceKeys.length - 1) {
        setResult(
          `Tested ${i + 1}/${bruteForceKeys.length} keys. Best so far: ${
            results.length > 0
              ? `${
                  results.sort(
                    (a, b) => b.wordStats.percentage - a.wordStats.percentage
                  )[0].key
                } (${results[0].wordStats.percentage.toFixed(2)}%)`
              : "None"
          }`
        );
      }

      // Early exit if we found a good match (over 80% word recognition)
      if (wordStats.percentage >= 80) {
        setResult(
          `Found high-probability key: ${testKey} (${wordStats.percentage.toFixed(
            2
          )}%)`
        );
        return {
          key: testKey,
          wordStats,
          decrypted,
        };
      }
    }

    // Sort results by word recognition percentage
    results.sort((a, b) => b.wordStats.percentage - a.wordStats.percentage);

    // Return best match if it's reasonable (over 50% recognition)
    if (results.length > 0 && results[0].wordStats.percentage > 50) {
      return results[0];
    }

    return null; // No good matches found
  };

  // Main function to decrypt or crack the cipher
  const crackCipher = () => {
    if (Object.keys(dictionary).length === 0) {
      setResult("Dictionary is still loading. Please wait a moment.");
      return;
    }

    setIsLoading(true);
    setResult("Analyzing ciphertext...");

    setTimeout(() => {
      try {
        // Remove non-letters for analysis
        const filteredText = ciphertext.replace(/[^a-zA-Z]/g, "");
        if (filteredText.length === 0) {
          setIsLoading(false);
          setResult("Please enter valid ciphertext with letters.");
          return;
        }

        // If user provided a key, just decrypt with it
        if (useKey && key) {
          const decrypted = decryptWithKey(ciphertext, key);
          setDecryptedText(decrypted);
          setResult(`Key: ${key}`);
          setIsLoading(false);
          return;
        }

        // Try brute force keys first if enabled
        if (useBruteForce) {
          const bruteForceResult = tryBruteForceKeys();

          // If we found a good match with brute force, use it
          if (bruteForceResult) {
            setKey(bruteForceResult.key);
            setDecryptedText(bruteForceResult.decrypted);

            // If it's a very good match (over 80%), we're done
            if (bruteForceResult.wordStats.percentage >= 80) {
              setResult(
                `Key found via brute force: ${
                  bruteForceResult.key
                } (Word recognition: ${bruteForceResult.wordStats.percentage.toFixed(
                  2
                )}%)`
              );
              setIsLoading(false);
              return;
            }

            // Otherwise, continue with regular methods but keep this as a baseline
            setResult(
              `Potential key found via brute force: ${
                bruteForceResult.key
              } (${bruteForceResult.wordStats.percentage.toFixed(
                2
              )}%). Continuing analysis...`
            );
          } else {
            setResult(
              "No strong matches found in predefined keys. Continuing with analysis..."
            );
          }
        }

        // Step 1: Find most likely key lengths
        const keyLengthScores = [];
        const maxLength = Math.min(parseInt(maxKeyLength) || 10, 15);

        for (let keyLength = 1; keyLength <= maxLength; keyLength++) {
          const sequences = getSequences(filteredText, keyLength);
          let totalIC = 0;

          // Calculate average IC for this key length
          sequences.forEach((seq) => {
            totalIC += calculateIC(seq);
          });

          const avgIC = totalIC / sequences.length;
          // Score based on how close IC is to English (0.067)
          const score = 1 - Math.abs(avgIC - 0.067) * 10;

          keyLengthScores.push({ keyLength, score });
        }

        // Sort by score (higher is better)
        keyLengthScores.sort((a, b) => b.score - a.score);

        // Try top 3 key lengths
        const topKeyLengths = keyLengthScores
          .slice(0, Math.min(3, keyLengthScores.length))
          .map((item) => item.keyLength);

        setResult(`Testing key lengths: ${topKeyLengths.join(", ")}...`);

        // Step 2: Try each key length
        const allResults = [];

        for (const keyLength of topKeyLengths) {
          // Split text into sequences
          const sequences = getSequences(filteredText, keyLength);

          // Find best shifts for each position in the key
          const shiftOptions = sequences.map((seq) => findBestShifts(seq));

          // Generate possible keys
          const possibleKeys = generateKeys(shiftOptions);

          // Test each key
          for (const key of possibleKeys) {
            const decrypted = decryptWithKey(ciphertext, key);
            const wordStats = countRecognizedWords(decrypted);

            // Keep keys that recognize at least some words
            if (wordStats.percentage > 15) {
              allResults.push({
                key,
                wordStats,
                decrypted,
              });
            }
          }
        }

        // Sort by word recognition
        allResults.sort(
          (a, b) => b.wordStats.percentage - a.wordStats.percentage
        );

        // Take up to 15 best results
        const topResults = allResults.slice(0, Math.min(15, allResults.length));

        if (topResults.length > 0) {
          let bestResult = {
            key: "",
            decrypted: "",
            wordStats: { percentage: 0 },
          };

          // Process each candidate
          for (let i = 0; i < topResults.length; i++) {
            const candidate = topResults[i];
            setResult(
              `Testing key candidate ${i + 1}/${topResults.length}: ${
                candidate.key
              } (${candidate.wordStats.percentage.toFixed(2)}%)`
            );

            // Skip refinement if already high recognition
            if (candidate.wordStats.percentage >= targetRecognition) {
              bestResult = {
                key: candidate.key,
                decrypted: candidate.decrypted,
                wordStats: candidate.wordStats,
              };
              break;
            }

            // Try to improve this key
            const { finalKey, decrypted, wordStats } = refineKey(
              candidate.key,
              targetRecognition,
              maxIterations
            );

            // Keep track of best result
            if (wordStats.percentage > bestResult.wordStats.percentage) {
              bestResult = {
                key: finalKey,
                decrypted,
                wordStats,
              };

              // Stop if we've reached target
              if (wordStats.percentage >= targetRecognition) {
                break;
              }
            }
          }

          // Set final results
          setKey(bestResult.key);
          setDecryptedText(bestResult.decrypted);
          setResult(
            `Key: ${
              bestResult.key
            } (Word recognition: ${bestResult.wordStats.percentage.toFixed(
              2
            )}%)`
          );
        } else {
          setResult(
            "No viable keys found. Try adjusting parameters or providing more ciphertext."
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setIsLoading(false);
        setResult(`Error: ${error.message}`);
      }
    }, 100);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vigenère Cipher Cracker</h1>

      <div className="mb-4">
        <label className="block mb-2">Ciphertext:</label>
        <textarea
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          className="w-full h-32 p-2 border border-gray-300 rounded"
          placeholder="Enter ciphertext here..."
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1">
          <label className="block mb-2">
            <input
              type="checkbox"
              checked={useKey}
              onChange={(e) => setUseKey(e.target.checked)}
              className="mr-2"
            />
            Use a specific key
          </label>

          {useKey && (
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter key (e.g., VIGENERE)"
            />
          )}
        </div>

        <div className="flex-1">
          <label className="block mb-2">
            <input
              type="checkbox"
              checked={useBruteForce}
              onChange={(e) => setUseBruteForce(e.target.checked)}
              className="mr-2"
            />
            Try brute force keys first
          </label>
          {useBruteForce && bruteForceKeys.length > 0 && (
            <div className="text-sm text-gray-600">
              {bruteForceKeys.length} keys available in VK.json
            </div>
          )}
        </div>

        <div className="flex-1">
          <label className="block mb-2">Maximum key length:</label>
          <input
            type="number"
            value={maxKeyLength}
            onChange={(e) => setMaxKeyLength(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            min="1"
            max="15"
          />
        </div>

        <div className="flex-1">
          <label className="block mb-2">Target word recognition (%):</label>
          <input
            type="number"
            value={targetRecognition}
            onChange={(e) => setTargetRecognition(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            min="50"
            max="100"
          />
        </div>

        <div className="flex-1">
          <label className="block mb-2">Maximum iterations:</label>
          <input
            type="number"
            value={maxIterations}
            onChange={(e) => setMaxIterations(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            min="5"
            max="50"
          />
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={crackCipher}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {useKey
            ? "Decrypt with Key"
            : useBruteForce
            ? "Try Keys & Crack Cipher"
            : "Crack Cipher"}
        </button>

        {isLoading && <div className="my-auto">Processing...</div>}
      </div>

      {decryptedText && (
        <div className="mb-4">
          <label className="block mb-2">Decrypted Text:</label>
          <div className="w-full p-3 border border-gray-300 rounded bg-gray-50 whitespace-pre-wrap">
            {decryptedText}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2">Key:</label>
        <pre className="w-full p-3 border border-gray-300 rounded overflow-auto whitespace-pre-wrap bg-gray-50">
          {result}
        </pre>
      </div>
    </div>
  );
}
