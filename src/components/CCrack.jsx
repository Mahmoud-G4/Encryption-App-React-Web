import React, { useState } from "react";
import styles from "../styles/Caesar.module.css";

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

export default function CCracker() {
  const [ciphertext, setCiphertext] = useState("");
  const [key, setKey] = useState("3");
  const [useKey, setUseKey] = useState(true);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Decrypt Caesar cipher with a given shift
  const decryptWithShift = (text, shift) => {
    if (shift === null || shift === undefined) return text;

    // Ensure shift is a number between 0-25
    const numericShift = parseInt(shift) % 26;
    if (isNaN(numericShift)) return text;

    return text
      .split("")
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const isUpperCase = char === char.toUpperCase();
          const charCode = char.toUpperCase().charCodeAt(0) - 65;

          // Decrypt: (charCode - shift + 26) % 26
          let decryptedCode = (charCode - numericShift + 26) % 26;
          let decryptedChar = String.fromCharCode(decryptedCode + 65);

          return isUpperCase ? decryptedChar : decryptedChar.toLowerCase();
        }
        return char;
      })
      .join("");
  };

  // Calculate letter frequencies in a string
  const getFrequencies = (text) => {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
    const frequencies = {};
    let total = cleanText.length;

    if (total === 0) return {};

    for (let char of cleanText) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    // Convert to relative frequencies
    for (const letter in frequencies) {
      frequencies[letter] /= total;
    }

    return frequencies;
  };

  // Calculate chi-squared statistic between observed and expected frequencies
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

  // Brute force all possible shifts with improved analysis
  const bruteForceDecrypt = (text) => {
    setIsLoading(true);

    setTimeout(() => {
      try {
        const results = [];

        // Try all possible shifts (0-25)
        for (let shift = 0; shift < 26; shift++) {
          const decrypted = decryptWithShift(text, shift);
          const frequencies = getFrequencies(decrypted);
          const chiSquared = calculateChiSquared(frequencies);

          results.push({
            shift,
            chiSquared,
            preview:
              decrypted.substring(0, 100) +
              (decrypted.length > 100 ? "..." : ""),
            fullText: decrypted,
          });
        }

        // Sort by chi-squared (lower is better linguistic match)
        results.sort((a, b) => a.chiSquared - b.chiSquared);

        // Format results for display
        let resultText =
          "Top 5 Possible Decryptions (Ranked by Letter Frequency):\n\n";

        for (let i = 0; i < Math.min(5, results.length); i++) {
          const result = results[i];
          resultText += `#${i + 1}: Shift: ${
            result.shift
          } (Chi²: ${result.chiSquared.toFixed(2)})\n`;
          resultText += `Preview: ${result.preview}\n\n`;
        }

        // Show the full decryption of the best match
        const bestShift = results[0].shift;
        resultText += `\nFull decryption of best match (Shift: ${bestShift}):\n${results[0].fullText}`;

        setResult(resultText);
      } catch (error) {
        setResult(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const crackCipher = () => {
    if (!ciphertext.trim()) {
      setResult("Please enter ciphertext to decrypt");
      return;
    }

    if (useKey) {
      if (!key || isNaN(parseInt(key))) {
        setResult("Please enter a valid numeric key");
        return;
      }

      const decrypted = decryptWithShift(ciphertext, key);
      setResult(`Decrypted text with shift ${key}:\n${decrypted}`);
    } else {
      bruteForceDecrypt(ciphertext);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Caesar Cipher Cracker</h1>

      <textarea
        className={styles.textInput}
        rows="4"
        cols="50"
        placeholder="Enter encrypted text..."
        value={ciphertext}
        onChange={(e) => setCiphertext(e.target.value)}
      />

      <div className={styles.optionRow}>
        <label className={styles.label}>
          Use Specific Key:
          <input
            type="checkbox"
            checked={useKey}
            onChange={() => setUseKey(!useKey)}
            className={styles.checkbox}
          />
        </label>

        {useKey && (
          <input
            type="number"
            className={styles.keyInput}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            min="1"
            max="25"
          />
        )}
      </div>

      <button
        className={styles.button}
        onClick={crackCipher}
        disabled={isLoading}
      >
        {isLoading
          ? "Decrypting..."
          : useKey
          ? "Decrypt With Key"
          : "Brute Force Decrypt"}
      </button>

      {!result ? null : (
        <div className={styles.resultsContainer}>
          <h3 className={styles.cardTitle}>Decryption Result</h3>
          <div className={styles.resultContent}>
            <pre className={styles.resultText}>{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
