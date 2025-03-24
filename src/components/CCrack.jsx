import React, { useState } from "react";
import styles from "../styles/Caesar.module.css"; // Import CSS module correctly

export default function CCracker() {
  const [ciphertext, setCiphertext] = useState("");
  const [key, setKey] = useState("3");
  const [useKey, setUseKey] = useState(true);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Decrypt Caesar cipher
  const decryptWithShift = (text, shift) => {
    if (shift === null || shift === undefined) return text;
    const numericShift = parseInt(shift) % 26;
    if (isNaN(numericShift)) return text;

    return text
      .split("")
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const isUpperCase = char === char.toUpperCase();
          const charCode = char.toUpperCase().charCodeAt(0) - 65;
          let decryptedCode = (charCode - numericShift + 26) % 26;
          let decryptedChar = String.fromCharCode(decryptedCode + 65);
          return isUpperCase ? decryptedChar : decryptedChar.toLowerCase();
        }
        return char;
      })
      .join("");
  };

  // Brute force all possible shifts (1-25)
  const bruteForceDecrypt = (text) => {
    setIsLoading(true);

    try {
      const results = [];

      // Try all possible shifts (1-25)
      for (let shift = 1; shift < 26; shift++) {
        const decrypted = decryptWithShift(text, shift);
        results.push(`Shift ${shift}: ${decrypted}`);
      }

      setResult(results.join("\n"));
    } catch (error) {
      setResult("Error during brute force decryption: " + error.message);
    } finally {
      setIsLoading(false);
    }
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
      setResult(`Decrypted text: ${decryptWithShift(ciphertext, key)}`);
    } else {
      // Implement brute force mode
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

      <div className={styles.optionRo}>
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
