import React, { useState } from "react";
import styles from "../styles/Rail.module.css";

export default function RailFenceCracker() {
  const [ciphertext, setCiphertext] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Decrypt Rail Fence cipher
  const decryptRailFence = (text, key) => {
    const n = text.length;
    const rail = Array.from({ length: key }, () => Array(n).fill(""));
    let dirDown = false,
      row = 0,
      col = 0;

    // Mark the rail pattern
    for (let i = 0; i < n; i++) {
      if (row === 0 || row === key - 1) dirDown = !dirDown;
      rail[row][col++] = "*";
      row += dirDown ? 1 : -1;
    }

    // Fill in the characters
    let index = 0;
    for (let i = 0; i < key; i++) {
      for (let j = 0; j < n; j++) {
        if (rail[i][j] === "*" && index < n) {
          rail[i][j] = text[index++];
        }
      }
    }

    // Read off the rail to decrypt
    let result = "";
    row = 0;
    col = 0;
    dirDown = false;
    for (let i = 0; i < n; i++) {
      if (row === 0 || row === key - 1) dirDown = !dirDown;
      result += rail[row][col++];
      row += dirDown ? 1 : -1;
    }
    return result;
  };

  // Score how likely the decryption is to be English text
  const scoreEnglishText = (text) => {
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
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    // Check for common patterns
    for (const pattern of commonPatterns) {
      const regex = new RegExp(pattern, "g");
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    // Check for space frequency (English has spaces roughly every 5 characters)
    const spaceCount = (text.match(/ /g) || []).length;
    if (text.length > 0) {
      const spaceRatio = spaceCount / text.length;
      // Ideal space ratio in English is around 0.15-0.20
      if (spaceRatio > 0.1 && spaceRatio < 0.25) {
        score += 10;
      }
    }

    return score;
  };

  // Brute force decrypt with scoring
  const bruteForceDecrypt = () => {
    if (!ciphertext.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const possibleResults = [];

        // Try different key sizes (minimum 2, maximum 10 or half the text length)
        for (let key = 2; key <= Math.min(ciphertext.length, 20); key++) {
          const decrypted = decryptRailFence(ciphertext, key);
          const score = scoreEnglishText(decrypted);

          possibleResults.push({
            key,
            text: decrypted,
            score,
            preview:
              decrypted.substring(0, 100) +
              (decrypted.length > 100 ? "..." : ""),
          });
        }

        // Sort by score (higher is better)
        const sortedResults = possibleResults.sort((a, b) => b.score - a.score);

        // Select top 5 results
        const topResults = sortedResults.slice(0, 5);

        setResults(topResults);
      } catch (error) {
        console.error("Decryption error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div className={styles["rail-fence-container"]}>
      <h2>Rail Fence Cipher Cracker</h2>

      <div className={styles["input-group"]}>
        <label htmlFor="ciphertext">Enter Ciphertext</label>
        <textarea
          id="ciphertext"
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
        />
      </div>

      <button
        onClick={bruteForceDecrypt}
        disabled={isLoading || !ciphertext.trim()}
      >
        {isLoading ? "ANALYZING..." : "CRACK CIPHER"}
      </button>

      {isLoading && <p>Analyzing cipher text...</p>}

      {results.length > 0 && (
        <div className={styles["results-container"]}>
          <h3>Possible Decryptions</h3>
          {results.map((result, index) => (
            <p key={index}>
              <strong>Key {result.key}:</strong> {result.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
