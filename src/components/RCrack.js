import React, { useState } from "react";
import "../styles/Rail.css";

export default function RailFenceCracker({ history }) {
  const [ciphertext, setCiphertext] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const decryptRailFence = (text, key) => {
    const n = text.length;
    const rail = Array.from({ length: key }, () => Array(n).fill(""));
    let dirDown = false,
      row = 0,
      col = 0;

    for (let i = 0; i < n; i++) {
      if (row === 0 || row === key - 1) dirDown = !dirDown;
      rail[row][col++] = "*";
      row += dirDown ? 1 : -1;
    }

    let index = 0;
    for (let i = 0; i < key; i++) {
      for (let j = 0; j < n; j++) {
        if (rail[i][j] === "*" && index < n) {
          rail[i][j] = text[index++];
        }
      }
    }

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

  const bruteForceDecrypt = () => {
    setIsLoading(true);
    setTimeout(() => {
      let possibleResults = [];
      for (let key = 2; key <= Math.min(ciphertext.length / 2, 10); key++) {
        possibleResults.push({ key, text: decryptRailFence(ciphertext, key) });
      }
      setResults(possibleResults);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="container">
      <h2>Rail Fence Cipher Cracker</h2>

      <div className="card">
        <label>Enter Ciphertext</label>
        <textarea
          className="text-input"
          rows="4"
          placeholder="Enter the encrypted text here..."
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
        />
      </div>

      <button onClick={bruteForceDecrypt} disabled={isLoading || !ciphertext.trim()}>
        CRACK CIPHER
      </button>

      <button className="back-button" onClick={() => history.goBack()} disabled={isLoading}>
        BACK TO ENCRYPTION
      </button>

      {isLoading && <p>Analyzing cipher text...</p>}

      {results.length > 0 && (
        <div className="results-container">
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
