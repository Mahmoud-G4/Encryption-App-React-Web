// MainScreen.js
import React, { useState, useEffect } from "react";
import "../styles/Main-Screen.css";
import logo from "../images/logo1.png";
import { useNavigate } from "react-router-dom";

export default function MainScreen() {
  const navigate = useNavigate(); // Get the navigation function
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
      .fill(null)
      .map(() => Array(str.length).fill(null)); // Use `null` instead of ""

    let rail = 0;
    let direction = 1; // 1 for down, -1 for up

    // Fill the fence pattern
    for (let i = 0; i < str.length; i++) {
      fence[rail][i] = str[i]; // Place every character, including spaces

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
        if (fence[i][j] !== null) {
          // Preserve spaces and other characters
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
    <div className="main-screen">
      <div className="main-screen__logo-container">
        <img src={logo} alt="Logo" className="main-screen__logo" />
      </div>
      <h2>Encryption Tool</h2>

      <div className="main-screen__card">
        <label className="main-screen__label">Enter Text</label>
        <textarea
          className="main-screen__text-input"
          placeholder="Type your message here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="main-screen__card">
        <h3>Encryption Keys</h3>

        <div className="main-screen__key-input-group">
          <label>Caesar Shift</label>
          <input
            type="number"
            className="main-screen__key-input"
            value={caesarKey}
            onChange={(e) => setCaesarKey(e.target.value)}
          />
        </div>

        <div className="main-screen__key-input-group">
          <label>Vigenère Key</label>
          <input
            type="text"
            className="main-screen__key-input"
            value={vigenereKey}
            onChange={(e) => setVigenereKey(e.target.value)}
          />
        </div>

        <div className="main-screen__key-input-group">
          <label>Rail Fence Rails</label>
          <input
            type="number"
            className="main-screen__key-input"
            value={railFenceKey}
            onChange={(e) => setRailFenceKey(e.target.value)}
          />
        </div>
      </div>

      <button className="main-screen__button" onClick={encryptText}>
        ENCRYPT
      </button>

      <button
        className="main-screen__button"
        onClick={() => navigate("CCracker")}
      >
        Caesar Cracker
      </button>

      <button
        className="main-screen__button"
        onClick={() => navigate("VCracker")}
      >
        Vigenère Cracker
      </button>
      <button
        className="main-screen__button"
        onClick={() => navigate("RFCracker")}
      >
        Rail Fence Cracker
      </button>

      {results.caesar || results.vigenere || results.railFence ? (
        <div className="main-screen__results-container">
          <h3>Encryption Results</h3>

          <div className="main-screen__result-box">
            <h4>Caesar Cipher</h4>
            <p className="main-screen__result-text">{results.caesar}</p>
          </div>

          <div className="main-screen__result-box">
            <h4>Vigenère Cipher</h4>
            <p className="main-screen__result-text">{results.vigenere}</p>
          </div>

          <div className="main-screen__result-box">
            <h4>Rail Fence Cipher</h4>
            <p className="main-screen__result-text">{results.railFence}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
