import React, { useState, useEffect } from "react";
import Data from "./Words.json";

export default function VCracker() {
  const [ciphertext, setCiphertext] = useState("");
  const [key, setKey] = useState("");
  const [useKey, setUseKey] = useState(true);
  const [maxKeyLength, setMaxKeyLength] = useState("10");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dictionary, setDictionary] = useState(null);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);
  const [wordWeighting, setWordWeighting] = useState("balanced");

  // Improved dictionary loading with word frequency weights
  useEffect(() => {
    const commonEnglishWords = Data.commonWords || [];

    // Create an improved dictionary with word frequency weighting
    const dict = {};

    // Assign weights based on word length and frequency
    commonEnglishWords.forEach((word, index) => {
      // Weight calculation: combine frequency ranking with word length importance
      let weight = 1.0;

      // Longer words (3-8 chars) get higher weights as they're more distinctive
      if (word.length >= 3 && word.length <= 8) {
        weight += (word.length - 2) * 0.2; // Progressively higher weight for longer words
      } else if (word.length > 8) {
        weight += 1.2; // Cap at a reasonable bonus for very long words
      }

      // Very common words (first 500 in list) get slightly higher weights
      if (index < 500) {
        weight += 0.5;
      }

      dict[word] = weight;
    });

    setDictionary(dict);
    setDictionaryLoaded(true);
    console.log(`Dictionary loaded with ${commonEnglishWords.length} words`);
  }, []);

  // English letter frequencies (A-Z) - Unchanged
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

  // Improved bigram and trigram frequencies for English
  const ENGLISH_BIGRAMS = {
    TH: 0.0356,
    HE: 0.0307,
    IN: 0.0243,
    ER: 0.0205,
    AN: 0.0199,
    RE: 0.0185,
    ON: 0.0176,
    AT: 0.0149,
    EN: 0.0145,
    ND: 0.0135,
    TI: 0.0134,
    ES: 0.0134,
    OR: 0.0128,
    TE: 0.012,
    OF: 0.0115,
    ED: 0.0117,
    IS: 0.0113,
    IT: 0.0112,
    AL: 0.0109,
    AR: 0.0107,
    ST: 0.0105,
    TO: 0.0104,
    NT: 0.0104,
    NG: 0.0095,
  };

  const ENGLISH_TRIGRAMS = {
    THE: 0.0181,
    AND: 0.0073,
    ING: 0.0073,
    ENT: 0.0042,
    ION: 0.0042,
    TIO: 0.0031,
    FOR: 0.0028,
    NDE: 0.0027,
    HAS: 0.0026,
    NCE: 0.0026,
    EDT: 0.0026,
    TIS: 0.0026,
    OFT: 0.0025,
    STH: 0.0025,
    MEN: 0.0025,
  };

  // Calculate Index of Coincidence for a string
  const calculateIC = (text) => {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
    const frequencies = {};
    const n = cleanText.length;

    // Count letter frequencies
    for (let i = 0; i < n; i++) {
      frequencies[cleanText[i]] = (frequencies[cleanText[i]] || 0) + 1;
    }

    // Calculate IC
    let sum = 0;
    for (const letter in frequencies) {
      const count = frequencies[letter];
      sum += count * (count - 1);
    }

    if (n <= 1) return 0;
    return sum / (n * (n - 1));
  };

  // Calculate character frequencies
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

    // Convert to relative frequencies
    for (const letter in frequencies) {
      frequencies[letter] /= total;
    }

    return frequencies;
  };

  // Improved Chi-squared statistic for language similarity
  const calculateChiSquared = (frequencies) => {
    let chiSquared = 0;

    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      const observed = frequencies[letter] || 0;
      const expected = ENGLISH_FREQUENCIES[letter] || 0;
      // Avoid division by zero
      if (expected > 0) {
        chiSquared += Math.pow(observed - expected, 2) / expected;
      }
    }

    return chiSquared;
  };

  // Count bigrams and trigrams in text
  const countNGrams = (text) => {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
    const bigrams = {};
    const trigrams = {};
    let totalBigrams = 0;
    let totalTrigrams = 0;

    // Count bigrams
    for (let i = 0; i < cleanText.length - 1; i++) {
      const bigram = cleanText.substring(i, i + 2);
      bigrams[bigram] = (bigrams[bigram] || 0) + 1;
      totalBigrams++;
    }

    // Count trigrams
    for (let i = 0; i < cleanText.length - 2; i++) {
      const trigram = cleanText.substring(i, i + 3);
      trigrams[trigram] = (trigrams[trigram] || 0) + 1;
      totalTrigrams++;
    }

    // Convert to frequencies
    for (const gram in bigrams) {
      bigrams[gram] /= totalBigrams;
    }

    for (const gram in trigrams) {
      trigrams[gram] /= totalTrigrams;
    }

    return { bigrams, trigrams };
  };

  // Calculate n-gram similarity score
  const calculateNGramScore = (text) => {
    const { bigrams, trigrams } = countNGrams(text);
    let bigramScore = 0;
    let trigramScore = 0;

    // Compare bigram frequencies with English
    for (const gram in ENGLISH_BIGRAMS) {
      const observed = bigrams[gram] || 0;
      const expected = ENGLISH_BIGRAMS[gram];
      if (observed > 0) {
        bigramScore +=
          Math.min(observed, expected) / Math.max(observed, expected);
      }
    }

    // Compare trigram frequencies with English
    for (const gram in ENGLISH_TRIGRAMS) {
      const observed = trigrams[gram] || 0;
      const expected = ENGLISH_TRIGRAMS[gram];
      if (observed > 0) {
        trigramScore +=
          Math.min(observed, expected) / Math.max(observed, expected);
      }
    }

    // Normalize and combine scores
    const normalizedBiScore = bigramScore / Object.keys(ENGLISH_BIGRAMS).length;
    const normalizedTriScore =
      trigramScore / Object.keys(ENGLISH_TRIGRAMS).length;

    return normalizedBiScore * 0.4 + normalizedTriScore * 0.6;
  };

  // Split text into sequences based on key length
  const getSequences = (text, keyLength) => {
    const sequences = Array(keyLength)
      .fill()
      .map(() => "");
    let j = 0;

    for (let i = 0; i < text.length; i++) {
      if (/[A-Z]/i.test(text[i])) {
        const position = j % keyLength;
        sequences[position] += text[i];
        j++;
      }
    }

    return sequences;
  };

  // Find the most likely shift for a single sequence using improved metrics
  const findBestShift = (sequence) => {
    let bestShift = 0;
    let lowestChiSquared = Infinity;

    for (let shift = 0; shift < 26; shift++) {
      // Decrypt with this shift
      let decrypted = "";
      for (let i = 0; i < sequence.length; i++) {
        const charCode = sequence.charCodeAt(i);

        if (charCode >= 65 && charCode <= 90) {
          // Uppercase letter
          decrypted += String.fromCharCode(
            ((charCode - 65 - shift + 26) % 26) + 65
          );
        } else if (charCode >= 97 && charCode <= 122) {
          // Lowercase letter
          decrypted += String.fromCharCode(
            ((charCode - 97 - shift + 26) % 26) + 97
          );
        } else {
          decrypted += sequence[i];
        }
      }

      // Calculate chi-squared for this decryption
      const frequencies = getFrequencies(decrypted);
      const chiSquared = calculateChiSquared(frequencies);

      if (chiSquared < lowestChiSquared) {
        lowestChiSquared = chiSquared;
        bestShift = shift;
      }
    }

    return bestShift;
  };

  // Improved method to find multiple possible shifts
  const findPossibleShifts = (sequence, numOptions = 3) => {
    const results = [];

    for (let shift = 0; shift < 26; shift++) {
      // Decrypt with this shift
      let decrypted = "";
      for (let i = 0; i < sequence.length; i++) {
        const charCode = sequence.charCodeAt(i);

        if (charCode >= 65 && charCode <= 90) {
          // Uppercase letter
          decrypted += String.fromCharCode(
            ((charCode - 65 - shift + 26) % 26) + 65
          );
        } else if (charCode >= 97 && charCode <= 122) {
          // Lowercase letter
          decrypted += String.fromCharCode(
            ((charCode - 97 - shift + 26) % 26) + 97
          );
        } else {
          decrypted += sequence[i];
        }
      }

      // Calculate chi-squared for this decryption
      const frequencies = getFrequencies(decrypted);
      const chiSquared = calculateChiSquared(frequencies);

      results.push({ shift, chiSquared });
    }

    // Sort by chi-squared (lower is better) and take the top options
    results.sort((a, b) => a.chiSquared - b.chiSquared);
    return results.slice(0, numOptions).map((r) => r.shift);
  };

  // Reconstruct the key based on shifts
  const reconstructKey = (shifts) => {
    return shifts.map((shift) => String.fromCharCode(shift + 65)).join("");
  };

  // Decrypt Vigenère cipher with a given key
  const decryptWithKey = (text, key) => {
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

        // Decrypt: (charCode - keyCode + 26) % 26
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
  };

  // Improved method to count recognized words with weighted scoring
  const countRecognizedWords = (text) => {
    if (!dictionary)
      return {
        count: 0,
        total: 0,
        percentage: 0,
        averageLength: 0,
        weightedScore: 0,
      };

    // Convert to lowercase and split by non-alphabetic characters
    const words = text
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 0);

    let recognizedCount = 0;
    let totalWordLength = 0;
    let weightedScore = 0;

    for (const word of words) {
      if (word.length >= 2) {
        // Only count words with 2+ letters
        totalWordLength += word.length;

        // Check if word is in dictionary
        const wordWeight = dictionary[word];
        if (wordWeight) {
          recognizedCount++;

          // Apply the word's weight to the total score
          weightedScore += wordWeight;
        }
      }
    }

    // Return both count and percentage with weighted score
    return {
      count: recognizedCount,
      total: words.length,
      percentage: words.length > 0 ? (recognizedCount / words.length) * 100 : 0,
      averageLength: words.length > 0 ? totalWordLength / words.length : 0,
      weightedScore: words.length > 0 ? weightedScore / words.length : 0,
    };
  };

  // Calculate improved score for how likely a text is to be English
  const scoreEnglishText = (text, weightingStrategy = wordWeighting) => {
    // Weights for different factors - adjustable based on weighting strategy
    let WORD_RECOGNITION_WEIGHT, PATTERN_WEIGHT, IC_WEIGHT, NGRAM_WEIGHT;

    // Configure weights based on selected strategy
    switch (weightingStrategy) {
      case "dictionary":
        WORD_RECOGNITION_WEIGHT = 70;
        PATTERN_WEIGHT = 5;
        IC_WEIGHT = 15;
        NGRAM_WEIGHT = 10;
        break;
      case "statistical":
        WORD_RECOGNITION_WEIGHT = 40;
        PATTERN_WEIGHT = 10;
        IC_WEIGHT = 20;
        NGRAM_WEIGHT = 30;
        break;
      case "balanced":
      default:
        WORD_RECOGNITION_WEIGHT = 55;
        PATTERN_WEIGHT = 5;
        IC_WEIGHT = 20;
        NGRAM_WEIGHT = 20;
        break;
    }

    // Get word recognition stats with weighted scoring
    const wordStats = countRecognizedWords(text);

    // Word recognition score - now using weighted scoring
    let wordRecognitionScore = Math.min(
      wordStats.percentage * (WORD_RECOGNITION_WEIGHT / 100) +
        wordStats.weightedScore * 10,
      WORD_RECOGNITION_WEIGHT
    );

    // Common English word fragments to check for
    const commonPatterns = [
      "the",
      "and",
      "ing",
      "ent",
      "ion",
      "to",
      "ed",
      "is",
      "it",
      "in",
      "at",
      "es",
      "re",
      "on",
      "an",
      "er",
      "nd",
      "as",
      "or",
      "ar",
      "kh",
      "ch",
      "ph",
      "sh",
      "able",
      "mis",
      "dis",
      "un",
      "re",
      "ness",
      "tion",
      "ment",
      "ough",
      "ould",
      "ally",
      "ight",
      "ought",
    ];

    const lowerText = text.toLowerCase();
    let patternScore = 0;

    // Check for common patterns
    for (const pattern of commonPatterns) {
      const regex = new RegExp(pattern, "g");
      const matches = lowerText.match(regex);
      if (matches) {
        patternScore += matches.length * 0.1; // 0.1 points per match
      }
    }
    patternScore = Math.min(patternScore, PATTERN_WEIGHT);

    // Index of Coincidence score
    const ic = calculateIC(text);
    // English text typically has IC around 0.067
    const icScore = Math.max(0, IC_WEIGHT - Math.abs(ic - 0.067) * 1000);

    // N-gram analysis score
    const ngramScore = calculateNGramScore(text) * NGRAM_WEIGHT;

    // Total score
    return wordRecognitionScore + patternScore + icScore + ngramScore;
  };

  // Generate key combinations more efficiently
  const generateKeyCombinations = (options, maxCombinations = 30) => {
    // Start with just the first set of options
    let combinations = options[0].map((shift) => [shift]);

    // For each position, expand the combinations
    for (let i = 1; i < options.length; i++) {
      // If we already have too many combinations, start pruning
      if (combinations.length > maxCombinations * 3) {
        // Sort current combinations by score
        combinations.sort((a, b) => {
          const keyA = reconstructKey(a);
          const keyB = reconstructKey(b);

          // Try a small sample of the text with each key
          const sampleLen = Math.min(ciphertext.length, 200);
          const sampleText = ciphertext.substring(0, sampleLen);

          const scoreA = scoreEnglishText(decryptWithKey(sampleText, keyA));
          const scoreB = scoreEnglishText(decryptWithKey(sampleText, keyB));

          return scoreB - scoreA;
        });

        // Keep only the most promising combinations
        combinations = combinations.slice(0, maxCombinations);
      }

      // Expand each combination with the new position options
      const newCombinations = [];
      for (const combo of combinations) {
        for (const shift of options[i]) {
          newCombinations.push([...combo, shift]);
        }
      }
      combinations = newCombinations;
    }

    // Convert shift arrays to key strings
    return combinations.map((shiftArray) =>
      shiftArray.map((shift) => String.fromCharCode(shift + 65)).join("")
    );
  };

  // Improved brute force approach using parallel processing
  const bruteForceAttack = () => {
    if (!dictionaryLoaded) {
      setResult(
        "Dictionary is still loading. Please wait a moment and try again."
      );
      return;
    }

    setIsLoading(true);

    // Use Web Workers for parallel processing if available
    const useWebWorker = false; // Set to false temporarily due to complexity

    // Define the core analysis function that can be used directly or in worker
    const analyzeText = () => {
      try {
        const filteredText = ciphertext.replace(/[^a-zA-Z]/g, "");
        if (filteredText.length === 0) {
          return { error: "Please enter valid ciphertext with letters" };
        }

        const maxLength = Math.min(parseInt(maxKeyLength) || 10, 15);
        const results = [];

        // First, prioritize likely key lengths using IC analysis
        const keyLengthScores = [];
        for (let keyLength = 1; keyLength <= maxLength; keyLength++) {
          const sequences = getSequences(filteredText, keyLength);

          // Calculate average IC for this key length
          let totalIC = 0;
          for (const seq of sequences) {
            totalIC += calculateIC(seq);
          }
          const avgIC = totalIC / sequences.length;

          // Score how close this is to English monographic IC (0.067)
          const icScore = 1 - Math.abs(avgIC - 0.067) * 10;
          keyLengthScores.push({ keyLength, score: icScore });
        }

        // Sort key lengths by IC score and prioritize the top ones
        keyLengthScores.sort((a, b) => b.score - a.score);
        const priorityKeyLengths = keyLengthScores
          .slice(0, 5)
          .map((item) => item.keyLength);

        // Analyze top key lengths first, then others if time permits
        const allKeyLengths = [...priorityKeyLengths];
        for (let i = 1; i <= maxLength; i++) {
          if (!priorityKeyLengths.includes(i)) {
            allKeyLengths.push(i);
          }
        }

        // Test key lengths in priority order
        for (const keyLength of allKeyLengths) {
          // Get sequences for this key length
          const sequences = getSequences(filteredText, keyLength);

          // Adjust numOptions based on key length
          const numOptions = keyLength <= 4 ? 4 : keyLength <= 8 ? 3 : 2;

          // Find possible shifts for each sequence position
          const shiftOptions = sequences.map((seq) =>
            findPossibleShifts(seq, numOptions)
          );

          // Generate combinations of keys from the top shifts more efficiently
          const keyCombinations = generateKeyCombinations(shiftOptions, 30);

          // Evaluate each key
          for (const key of keyCombinations) {
            const decrypted = decryptWithKey(ciphertext, key);
            const ic = calculateIC(decrypted);
            const score = scoreEnglishText(decrypted);
            const wordStats = countRecognizedWords(decrypted);

            results.push({
              key,
              keyLength: key.length,
              ic,
              score,
              wordStats,
              preview:
                decrypted.substring(0, 100) +
                (decrypted.length > 100 ? "..." : ""),
            });

            // Early termination if we find an exceptionally good key
            if (wordStats.percentage > 85 && wordStats.total > 10) {
              break;
            }
          }
        }

        // Sort by score (higher is better)
        results.sort((a, b) => b.score - a.score);

        // Take top results
        const topResults = results.slice(0, 10);

        if (topResults.length === 0) {
          return {
            error:
              "Could not find any viable keys. Try different ciphertext or adjust max key length.",
          };
        }

        return { topResults };
      } catch (error) {
        return { error: error.message };
      }
    };

    // Process will be done directly (not using web workers for simplicity)
    setTimeout(() => {
      const analysisResult = analyzeText();

      if (analysisResult.error) {
        setResult(analysisResult.error);
        setIsLoading(false);
        return;
      }

      const { topResults } = analysisResult;

      // Format results for display
      let resultText = "Top 10 Possible Keys:\n\n";

      topResults.forEach((result, index) => {
        resultText += `#${index + 1}: Key: ${result.key} (Length: ${
          result.keyLength
        }, Score: ${result.score.toFixed(2)}, IC: ${result.ic.toFixed(4)})\n`;
        resultText += `Words recognized: ${result.wordStats.count}/${
          result.wordStats.total
        } (${result.wordStats.percentage.toFixed(1)}%)\n`;
        resultText += `Preview: ${result.preview}\n\n`;
      });

      // Show the full decryption of the top result
      const bestKey = topResults[0].key;
      const fullDecryption = decryptWithKey(ciphertext, bestKey);
      resultText += `\nFull decryption of best match (Key: ${bestKey}):\n${fullDecryption}`;

      setResult(resultText);
      setIsLoading(false);
    }, 100);
  };

  // Crack with the provided key or brute force
  const crackCipher = () => {
    if (!ciphertext) {
      setResult("Please enter ciphertext to decrypt");
      return;
    }

    if (useKey) {
      if (!key) {
        setResult("Please enter a key");
        return;
      }

      const decrypted = decryptWithKey(ciphertext, key);

      if (dictionaryLoaded) {
        const wordStats = countRecognizedWords(decrypted);
        const ic = calculateIC(decrypted);
        setResult(
          `Decrypted text (${wordStats.count}/${
            wordStats.total
          } words recognized, ${wordStats.percentage.toFixed(
            1
          )}%, IC: ${ic.toFixed(4)}):\n${decrypted}`
        );
      } else {
        setResult(`Decrypted text:\n${decrypted}`);
      }
    } else {
      bruteForceAttack();
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Enhanced Vigenère Cipher Cracker
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
          backgroundColor: "#1e1e1e",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <label
          style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}
        >
          Ciphertext:
        </label>
        <textarea
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          rows="6"
          style={{
            width: "90%",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginBottom: "15px",
            backgroundColor: "#2c2c2c",
            resize: "none",
            color: "white",

            alignSelf: "center",
          }}
          placeholder="Enter the encrypted text here..."
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <label style={{ marginRight: "10px", fontWeight: "bold" }}>
            Use Known Key:
          </label>
          <input
            type="checkbox"
            checked={useKey}
            onChange={(e) => setUseKey(e.target.checked)}
            style={{ transform: "scale(1.2)", backgroundColor: "#2c2c2c" }}
          />
        </div>

        {useKey ? (
          <div>
            <label style={{ display: "block", marginBottom: "10px" }}>
              Enter Key:
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{
                width: "50%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                marginBottom: "10px",
                backgroundColor: "#2c2c2c",
                color: "white",
              }}
              placeholder="Enter decryption key"
            />
          </div>
        ) : (
          <div>
            <label style={{ display: "block", marginBottom: "10px" }}>
              Max Key Length:
            </label>
            <input
              type="number"
              value={maxKeyLength}
              onChange={(e) => setMaxKeyLength(e.target.value)}
              min="1"
              max="15"
              style={{
                width: "50%",
                padding: "10px",
                borderRadius: "4px",
                color: "white",
                border: "1px solid #ccc",
                marginBottom: "10px",
                backgroundColor: "#2c2c2c",
              }}
            />

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Analysis Strategy:
              </label>
              <select
                value={wordWeighting}
                onChange={(e) => setWordWeighting(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#2c2c2c",
                  color: "white",
                }}
              >
                <option value="balanced">Balanced (Default)</option>
                <option value="dictionary">Dictionary-Focused</option>
                <option value="statistical">Statistical Analysis</option>
              </select>
            </div>

            <p
              style={{ fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}
            >
              Uses weighted dictionary analysis with n-gram statistics to find
              keys that produce meaningful English text. Shows top 10 most
              likely keys ranked by comprehensive linguistic analysis.
            </p>
          </div>
        )}

        <button
          onClick={crackCipher}
          disabled={isLoading || !dictionaryLoaded}
          style={{
            backgroundColor: "#bb86fc",
            color: "black",
            padding: "12px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !dictionaryLoaded ? "not-allowed" : "pointer",
            width: "100%",
            fontWeight: "bold",
            marginTop: "10px",
          }}
        >
          {isLoading
            ? "Analyzing..."
            : !dictionaryLoaded
            ? "Loading Dictionary..."
            : useKey
            ? "DECRYPT WITH KEY"
            : "CRACK CIPHER"}
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              animation: "spin 2s linear infinite",
              margin: "0 auto",
            }}
          ></div>
          <p style={{ marginTop: "10px" }}>Analyzing cipher text...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {result && (
        <div
          style={{
            backgroundColor: "#1e1e1e",
            display: "block",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
            overflowX: "scroll",
          }}
        >
          <pre
            style={{
              lineBreak: "anywhere",
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
