// MainScreen.js
import React, { useState } from "react";
import "./assets/styles/Main-Screen.css";
import logo from "./assets/images/logo.png"; 

export default function MainScreen({ navigate }) {
  const [text, setText] = useState("");
  const [caesarKey, setCaesarKey] = useState("3");
  const [vigenereKey, setVigenereKey] = useState("KEY");
  const [railFenceKey, setRailFenceKey] = useState("3");
  const [results, setResults] = useState({
    caesar: "",
    vigenere: "",
    railFence: "",
  });

  // Caesar Cipher implementation
  const caesarCipher = (str, shift) => {
    shift = parseInt(shift) % 26;
    if (shift < 0) shift += 26;

    return str
      .split("")
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const code = char.charCodeAt(0);
          let shiftedCode;

          // Uppercase letters
          if (code >= 65 && code <= 90) {
            shiftedCode = ((code - 65 + shift) % 26) + 65;
          }
          // Lowercase letters
          else if (code >= 97 && code <= 122) {
            shiftedCode = ((code - 97 + shift) % 26) + 97;
          }

          return String.fromCharCode(shiftedCode);
        }
        return char;
      })
      .join("");
  };

  // Vigenère Cipher implementation
  const vigenereCipher = (str, key) => {
    if (!key) return str;

    const upperKey = key.toUpperCase();
    let result = "";
    let keyIndex = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char.match(/[a-z]/i)) {
        const isUpperCase = char === char.toUpperCase();
        const charCode = char.toUpperCase().charCodeAt(0) - 65;
        const keyChar = upperKey[keyIndex % upperKey.length];
        const keyCode = keyChar.charCodeAt(0) - 65;

        let encryptedCode = (charCode + keyCode) % 26;
        let encryptedChar = String.fromCharCode(encryptedCode + 65);

        if (!isUpperCase) {
          encryptedChar = encryptedChar.toLowerCase();
        }

        result += encryptedChar;
        keyIndex++;
      } else {
        result += char;
      }
    }

    return result;
  };

  // Rail Fence Cipher implementation
  const railFenceCipher = (str, key) => {
    const rails = parseInt(key);
    if (rails <= 1 || rails >= str.length) return str;

    // Create the rail fence pattern
    const fence = Array(rails)
      .fill()
      .map(() => Array(str.length).fill(""));

    let rail = 0;
    let direction = 1; // 1 for down, -1 for up

    // Fill the fence pattern
    for (let i = 0; i < str.length; i++) {
      fence[rail][i] = str[i];

      if (rail === 0) {
        direction = 1;
      } else if (rail === rails - 1) {
        direction = -1;
      }

      rail += direction;
    }

    // Read off the fence pattern
    let result = "";
    for (let i = 0; i < rails; i++) {
      for (let j = 0; j < str.length; j++) {
        if (fence[i][j] !== "") {
          result += fence[i][j];
        }
      }
    }

    return result;
  };

  const encryptText = () => {
    if (!text) return;

    setResults({
      caesar: caesarCipher(text, caesarKey),
      vigenere: vigenereCipher(text, vigenereKey),
      railFence: railFenceCipher(text, railFenceKey),
    });
  };

  return (
    <div className="container">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      <h2>Encryption Tool</h2>

      <div className="card">
        <label>Enter Text</label>
        <textarea
          className="text-input"
          placeholder="Type your message here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="card">
        <h3>Encryption Keys</h3>

        <div className="key-input-group">
          <label>Caesar Shift</label>
          <input
            type="number"
            className="key-input"
            value={caesarKey}
            onChange={(e) => setCaesarKey(e.target.value)}
          />
        </div>

        <div className="key-input-group">
          <label>Vigenère Key</label>
          <input
            type="text"
            className="key-input"
            value={vigenereKey}
            onChange={(e) => setVigenereKey(e.target.value)}
          />
        </div>

        <div className="key-input-group">
          <label>Rail Fence Rails</label>
          <input
            type="number"
            className="key-input"
            value={railFenceKey}
            onChange={(e) => setRailFenceKey(e.target.value)}
          />
        </div>
      </div>

      <button className="button" onClick={encryptText}>ENCRYPT</button>

      <button className="button" onClick={() => navigate("CCracker")}>
        Caesar Cracker
      </button>
      <button className="button" onClick={() => navigate("VCracker")}>
        Vigenère Cracker
      </button>
      <button className="button" onClick={() => navigate("RFCracker")}>
        Rail Fence Cracker
      </button>

      {results.caesar || results.vigenere || results.railFence ? (
        <div className="results-container">
          <h3>Encryption Results</h3>

          <div className="result-box">
            <h4>Caesar Cipher</h4>
            <p className="result-text">{results.caesar}</p>
          </div>

          <div className="result-box">
            <h4>Vigenère Cipher</h4>
            <p className="result-text">{results.vigenere}</p>
          </div>

          <div className="result-box">
            <h4>Rail Fence Cipher</h4>
            <p className="result-text">{results.railFence}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
