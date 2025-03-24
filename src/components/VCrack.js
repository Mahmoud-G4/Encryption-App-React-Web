// VCracker.js (React.js Web Version)
import React, { useState } from "react";

export default function VCracker() {
  const [ciphertext, setCiphertext] = useState("");
  const [maxKeyLength, setMaxKeyLength] = useState("10");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // English letter frequencies (A-Z)
  const ENGLISH_FREQUENCIES = {
    A: 0.0812, B: 0.0149, C: 0.0271, D: 0.0432, E: 0.1202, 
    F: 0.0230, G: 0.0203, H: 0.0592, I: 0.0731, J: 0.0010, 
    K: 0.0069, L: 0.0398, M: 0.0261, N: 0.0695, O: 0.0768, 
    P: 0.0182, Q: 0.0011, R: 0.0602, S: 0.0628, T: 0.0910, 
    U: 0.0288, V: 0.0111, W: 0.0209, X: 0.0017, Y: 0.0211, 
    Z: 0.0007
  };

  // Calculate character frequencies
  const getFrequencies = (text) => {
    const counts = {};
    const length = text.length;

    for (let char of text.toUpperCase()) {
      if (char >= "A" && char <= "Z") {
        counts[char] = (counts[char] || 0) + 1;
      }
    }

    return Object.keys(ENGLISH_FREQUENCIES).map(
      (letter) => (counts[letter] || 0) / length
    );
  };

  // Chi-squared statistic for language similarity
  const calculateChiSquared = (frequencies) => {
    return Object.keys(ENGLISH_FREQUENCIES).reduce((sum, letter, i) => {
      const expected = ENGLISH_FREQUENCIES[letter] * frequencies.length;
      return sum + Math.pow(frequencies[i] * frequencies.length - expected, 2) / expected;
    }, 0);
  };

  // Get likely key shifts for each sequence
  const findBestShift = (sequence) => {
    let bestShift = 0;
    let lowestChiSquared = Infinity;

    for (let shift = 0; shift < 26; shift++) {
      let decrypted = "";
      for (let i = 0; i < sequence.length; i++) {
        let charCode = sequence.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
          decrypted += String.fromCharCode(((charCode - 65 - shift + 26) % 26) + 65);
        }
      }

      const chiSquared = calculateChiSquared(getFrequencies(decrypted));

      if (chiSquared < lowestChiSquared) {
        lowestChiSquared = chiSquared;
        bestShift = shift;
      }
    }

    return bestShift;
  };

  // Reconstruct key from shifts
  const reconstructKey = (shifts) => {
    return shifts.map((shift) => String.fromCharCode(shift + 65)).join("");
  };

  // Decrypt ciphertext with a key
  const decryptWithKey = (text, key) => {
    let decrypted = "";
    const keyLength = key.length;
    let keyIndex = 0;

    for (let i = 0; i < text.length; i++) {
      let char = text[i];
      if (char.match(/[A-Z]/i)) {
        const shift = key.charCodeAt(keyIndex % keyLength) - 65;
        let decryptedChar = String.fromCharCode(((char.toUpperCase().charCodeAt(0) - 65 - shift + 26) % 26) + 65);
        decrypted += decryptedChar;
        keyIndex++;
      } else {
        decrypted += char;
      }
    }

    return decrypted;
  };

  // Score decrypted text based on English frequency similarity
  const scoreEnglishText = (text) => {
    const textFrequencies = getFrequencies(text);
    return 1 / (1 + calculateChiSquared(textFrequencies));
  };

  // Split text into sequences based on key length
  const getSequences = (text, keyLength) => {
    const sequences = Array.from({ length: keyLength }, () => "");
    let j = 0;

    for (let i = 0; i < text.length; i++) {
      if (/[A-Z]/i.test(text[i])) {
        sequences[j % keyLength] += text[i];
        j++;
      }
    }

    return sequences;
  };

  // Perform brute force attack
  const bruteForceAttack = () => {
    setIsLoading(true);

    setTimeout(() => {
      try {
        const filteredText = ciphertext.replace(/[^a-zA-Z]/g, "");
        if (filteredText.length === 0) {
          setResult("Please enter valid ciphertext.");
          setIsLoading(false);
          return;
        }

        const maxLength = Math.min(parseInt(maxKeyLength) || 10, 15);
        const results = [];

        for (let keyLength = 1; keyLength <= maxLength; keyLength++) {
          const sequences = getSequences(filteredText, keyLength);
          const shiftOptions = sequences.map((seq) => findBestShift(seq));

          const key = reconstructKey(shiftOptions);
          const decrypted = decryptWithKey(ciphertext, key);
          const score = scoreEnglishText(decrypted);

          results.push({ key, keyLength, score, preview: decrypted.substring(0, 100) + "..." });
        }

        results.sort((a, b) => b.score - a.score);
        setResult(results.slice(0, 10).map((r) => `Key: ${r.key}, Preview: ${r.preview}`).join("\n"));
      } catch (error) {
        setResult("An error occurred.");
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Vigenère Cipher Cracker</h2>
      <label>Ciphertext:</label>
      <textarea value={ciphertext} onChange={(e) => setCiphertext(e.target.value)} rows="4" cols="50"></textarea>

      <label>Max Key Length:</label>
      <input
        type="number"
        value={maxKeyLength}
        onChange={(e) => setMaxKeyLength(e.target.value)}
        min="1"
        max="15"
      />

      <button onClick={bruteForceAttack} disabled={isLoading} style={{ marginTop: "10px" }}>
        {isLoading ? "Cracking..." : "Crack Cipher"}
      </button>

      <pre style={{ whiteSpace: "pre-wrap", backgroundColor: "#f4f4f4", padding: "10px", marginTop: "10px" }}>
        {result}
      </pre>
    </div>
  );
}
