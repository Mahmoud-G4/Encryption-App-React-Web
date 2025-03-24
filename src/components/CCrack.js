import React, { useState } from "react";
import "../styles/Caesar.css"; // Import CSS file

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
      setResult("Brute-force mode is not implemented in this version.");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Caesar Cipher Cracker</h1>
      <textarea
        className="text-input"
        rows="4"
        cols="50"
        placeholder="Enter encrypted text..."
        value={ciphertext}
        onChange={(e) => setCiphertext(e.target.value)}
      />
      <br />
      <label className="label">
        Use Key:
        <input
          type="checkbox"
          checked={useKey}
          onChange={() => setUseKey(!useKey)}
        />
      </label>
      {useKey && (
        <input
          type="number"
          className="key-input"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      )}
      <br />
      <button className="button" onClick={crackCipher} disabled={isLoading}>
        {isLoading ? "Decrypting..." : "Crack Cipher"}
      </button>
      <div className="results-container">
        <h3 className="card-title">Decryption Result</h3>
        <div className="result-content">
          <pre className="result-text">{result}</pre>
        </div>
      </div>
    </div>
  );
}
