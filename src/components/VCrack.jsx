import React, { useState, useEffect, useRef } from "react";
import "../styles/Vegenire.module.css";
import Data from "./Words.json";
import VKData from "./VK.json";
import * as VigenereLogic from "./VigenereLogic";

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
  const [maxIterations, setMaxIterations] = useState(35);
  const [useBruteForce, setUseBruteForce] = useState(false);
  const [bruteForceKeys, setBruteForceKeys] = useState([]);
  const [workerCount, setWorkerCount] = useState(4);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Refs for workers and cancellation
  const workersRef = useRef([]);
  const activeWorkersRef = useRef(0);
  const isCancelledRef = useRef(false);

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

    // Determine optimal worker count based on available CPUs
    if (window.navigator && window.navigator.hardwareConcurrency) {
      // Use available CPU cores minus 1 to leave one for UI
      const optimalWorkers = Math.max(
        1,
        window.navigator.hardwareConcurrency - 1
      );
      setWorkerCount(optimalWorkers);
    }

    // Clean up workers on unmount
    return () => {
      terminateAllWorkers();
    };
  }, []);

  // Initialize web workers
  const initializeWorkers = () => {
    terminateAllWorkers();
    workersRef.current = [];
    activeWorkersRef.current = 0;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(
        new URL("./VigenereWorker.js", import.meta.url)
      );

      worker.onmessage = (e) => {
        handleWorkerMessage(e.data, i);
      };

      worker.onerror = (error) => {
        console.error(`Worker ${i} error:`, error);
        setResult((prev) => `${prev}\nError in worker ${i}: ${error.message}`);
        activeWorkersRef.current--;
        checkWorkersComplete();
      };

      workersRef.current.push(worker);
    }
  };

  // Terminate all workers
  const terminateAllWorkers = () => {
    if (workersRef.current.length > 0) {
      workersRef.current.forEach((worker) => {
        if (worker) {
          worker.terminate();
        }
      });
      workersRef.current = [];
    }
  };

  // Check if all workers have completed
  const checkWorkersComplete = () => {
    if (activeWorkersRef.current === 0) {
      setIsLoading(false);
      processAllResults();
    }
  };

  // Storage for worker results
  const bruteForceResultsRef = useRef([]);
  const candidateResultsRef = useRef([]);
  const refinementResultsRef = useRef({});

  // Handle messages from workers
  const handleWorkerMessage = (data, workerId) => {
    if (isCancelledRef.current) return;

    const { type, results, result } = data;

    switch (type) {
      case "bruteForceResult":
        bruteForceResultsRef.current = [
          ...bruteForceResultsRef.current,
          ...results,
        ];
        setProgressPercentage((prev) =>
          Math.min(95, prev + (100 / workerCount) * 0.9)
        );
        activeWorkersRef.current--;
        checkWorkersComplete();
        break;

      case "candidatesResult":
        candidateResultsRef.current = [
          ...candidateResultsRef.current,
          ...results,
        ];
        setProgressPercentage((prev) =>
          Math.min(95, prev + (100 / workerCount) * 0.9)
        );
        activeWorkersRef.current--;
        checkWorkersComplete();
        break;

      case "refineResult":
        refinementResultsRef.current = result;
        setProgressPercentage(100);
        activeWorkersRef.current--;
        checkWorkersComplete();
        break;

      default:
        console.warn("Unknown message type:", type);
        activeWorkersRef.current--;
        checkWorkersComplete();
    }
  };

  // Process all results from workers
  const processAllResults = () => {
    if (isCancelledRef.current) {
      setResult("Operation cancelled.");
      setProgressPercentage(0);
      return;
    }

    if (useBruteForce && bruteForceResultsRef.current.length > 0) {
      // Sort brute force results by word recognition percentage
      const sortedResults = [...bruteForceResultsRef.current].sort(
        (a, b) => b.wordStats.percentage - a.wordStats.percentage
      );

      // Take top 5 results
      const topResults = sortedResults.slice(0, 5);
      const bestResult = topResults[0];

      setKey(bestResult.key);
      setDecryptedText(bestResult.decrypted);

      // Format results display
      let resultText = "Top 5 potential keys:\n";
      topResults.forEach((item, index) => {
        resultText += `${index + 1}. Key: ${
          item.key
        } (${item.wordStats.percentage.toFixed(2)}% recognition)\n`;
        if (index === 0) {
          resultText += `   Decryption: ${item.decrypted.substring(0, 100)}${
            item.decrypted.length > 100 ? "..." : ""
          }\n\n`;
        }
      });

      setResult(resultText);
    } else if (candidateResultsRef.current.length > 0) {
      // Sort candidate results by word recognition percentage
      const sortedResults = [...candidateResultsRef.current].sort(
        (a, b) => b.wordStats.percentage - a.wordStats.percentage
      );

      const bestResult = sortedResults[0];

      setKey(bestResult.key);
      setDecryptedText(bestResult.decrypted);

      // Format results display
      let resultText = `Key found: ${bestResult.key}\n`;
      resultText += `Recognition rate: ${bestResult.wordStats.percentage.toFixed(
        2
      )}%\n`;
      resultText += `Words recognized: ${bestResult.wordStats.count}/${bestResult.wordStats.total}\n`;
      if (bestResult.refined) {
        resultText += `Key was refined over ${bestResult.iterations} iterations\n`;
      }
      resultText += `\nDecryption preview:\n${bestResult.decrypted.substring(
        0,
        200
      )}${bestResult.decrypted.length > 200 ? "..." : ""}`;

      setResult(resultText);
    } else if (Object.keys(refinementResultsRef.current).length > 0) {
      const refinedResult = refinementResultsRef.current;

      setKey(refinedResult.finalKey);
      setDecryptedText(refinedResult.decrypted);

      // Format results display
      let resultText = `Refined key: ${refinedResult.finalKey}\n`;
      resultText += `Recognition rate: ${refinedResult.wordStats.percentage.toFixed(
        2
      )}%\n`;
      resultText += `Words recognized: ${refinedResult.wordStats.count}/${refinedResult.wordStats.total}\n`;
      resultText += `Iterations: ${refinedResult.iterations}\n`;
      resultText += `\nDecryption preview:\n${refinedResult.decrypted.substring(
        0,
        200
      )}${refinedResult.decrypted.length > 200 ? "..." : ""}`;

      setResult(resultText);
    } else {
      setResult(
        "No viable solutions found. Try adjusting parameters or try a different ciphertext."
      );
    }

    setProgressPercentage(0);
  };

  // Cancel ongoing operations
  const handleCancel = () => {
    isCancelledRef.current = true;
    terminateAllWorkers();
    setIsLoading(false);
    setProgressPercentage(0);
    setResult("Operation cancelled by user.");
  };

  // Start cryptanalysis process
  const crackCipher = async () => {
    if (!ciphertext.trim()) {
      setResult("Please enter ciphertext to decrypt.");
      return;
    }

    // Reset state
    setIsLoading(true);
    setProgressPercentage(5);
    setResult("Analyzing ciphertext...");
    isCancelledRef.current = false;
    bruteForceResultsRef.current = [];
    candidateResultsRef.current = [];
    refinementResultsRef.current = {};

    // Initialize workers
    initializeWorkers();

    try {
      // If using a known key
      if (useKey && key.trim()) {
        setProgressPercentage(10);
        setResult("Decrypting with provided key...");

        // Decrypt with the provided key
        const decrypted = VigenereLogic.decryptWithKey(ciphertext, key);
        const wordStats = VigenereLogic.countRecognizedWords(
          decrypted,
          dictionary
        );

        setDecryptedText(decrypted);
        setResult(
          `Decryption with key "${key}":\nRecognition rate: ${wordStats.percentage.toFixed(
            2
          )}%\nWords recognized: ${wordStats.count}/${wordStats.total}`
        );
        setProgressPercentage(0);
        setIsLoading(false);

        // Optionally refine the key if recognition is low
        if (wordStats.percentage < 70) {
          const shouldRefine = window.confirm(
            `Word recognition is low (${wordStats.percentage.toFixed(
              2
            )}%). Would you like to try refining the key?`
          );

          if (shouldRefine) {
            refineExistingKey(key);
          }
        }

        return;
      }

      // If using brute force with known keys
      if (useBruteForce && bruteForceKeys.length > 0) {
        setProgressPercentage(10);
        setResult("Trying known keys (brute force approach)...");

        // Split keys among workers
        const keysPerWorker = Math.ceil(bruteForceKeys.length / workerCount);
        activeWorkersRef.current = workerCount;

        for (let i = 0; i < workerCount; i++) {
          const startIdx = i * keysPerWorker;
          const endIdx = Math.min(
            startIdx + keysPerWorker,
            bruteForceKeys.length
          );
          const workerKeys = bruteForceKeys.slice(startIdx, endIdx);

          if (workerKeys.length === 0) {
            activeWorkersRef.current--;
            continue;
          }

          workersRef.current[i].postMessage({
            type: "processBruteForce",
            data: {
              keys: workerKeys,
              bruteForceText: ciphertext,
              bruteForceDict: dictionary,
            },
          });
        }

        return;
      }

      // Cryptanalysis approach using Index of Coincidence
      setProgressPercentage(15);
      setResult("Analyzing possible key lengths using Index of Coincidence...");

      // Clean the ciphertext
      const cleanText = ciphertext.toUpperCase().replace(/[^A-Z]/g, "");

      // Find possible key lengths using IC analysis
      const keyLengthScores = [];
      for (let length = 1; length <= maxKeyLength; length++) {
        const sequences = VigenereLogic.getSequences(cleanText, length);
        let totalIC = 0;

        for (const seq of sequences) {
          totalIC += VigenereLogic.calculateIC(seq);
        }

        const avgIC = totalIC / length;
        keyLengthScores.push({ length, ic: avgIC });
      }

      // Sort by descending IC value (higher is better)
      keyLengthScores.sort((a, b) => b.ic - a.ic);

      // Take top 3 possible key lengths
      const topKeyLengths = keyLengthScores.slice(0, 3);

      setProgressPercentage(25);
      setResult(
        `Analyzing possible keys for lengths: ${topKeyLengths
          .map((k) => `${k.length} (IC: ${k.ic.toFixed(4)})`)
          .join(", ")}`
      );

      // Generate key candidates for each length
      const allCandidates = [];

      for (const keyLengthObj of topKeyLengths) {
        const keyLength = keyLengthObj.length;
        const sequences = VigenereLogic.getSequences(cleanText, keyLength);
        const shiftOptions = sequences.map((seq) =>
          VigenereLogic.findBestShifts(seq, 3)
        );

        // Generate keys from shift combinations
        const keyCandidates = VigenereLogic.generateKeys(shiftOptions);
        allCandidates.push(...keyCandidates);
      }

      setProgressPercentage(40);
      setResult(`Testing ${allCandidates.length} potential keys...`);

      // Distribute candidates among workers
      const candidatesPerWorker = Math.ceil(allCandidates.length / workerCount);
      activeWorkersRef.current = workerCount;

      for (let i = 0; i < workerCount; i++) {
        const startIdx = i * candidatesPerWorker;
        const endIdx = Math.min(
          startIdx + candidatesPerWorker,
          allCandidates.length
        );
        const workerCandidates = allCandidates.slice(startIdx, endIdx);

        if (workerCandidates.length === 0) {
          activeWorkersRef.current--;
          continue;
        }

        workersRef.current[i].postMessage({
          type: "processCandidates",
          data: {
            candidates: workerCandidates,
            ciphertext: ciphertext,
            dictionary: dictionary,
            targetPercentage: targetRecognition,
            maxIterations: maxIterations,
          },
        });
      }
    } catch (error) {
      setIsLoading(false);
      setProgressPercentage(0);
      setResult(`Error during cryptanalysis: ${error.message}`);
      console.error("Cryptanalysis error:", error);
    }
  };

  // Refine an existing key
  const refineExistingKey = (keyToRefine) => {
    setIsLoading(true);
    setProgressPercentage(10);
    setResult(`Refining key "${keyToRefine}"...`);
    isCancelledRef.current = false;

    // Initialize workers
    initializeWorkers();

    // Use just one worker for refinement
    activeWorkersRef.current = 1;

    workersRef.current[0].postMessage({
      type: "refineKey",
      data: {
        key: keyToRefine,
        refineText: ciphertext,
        refineDict: dictionary,
        refineTarget: targetRecognition,
        refineMaxIter: 100, // Use more iterations for refinement
      },
    });
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
          disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={useKey || isLoading}
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
            onChange={(e) => setMaxKeyLength(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
            min="1"
            max="15"
            disabled={isLoading || useBruteForce || useKey}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2">Target word recognition (%):</label>
          <input
            type="number"
            value={targetRecognition}
            onChange={(e) => setTargetRecognition(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
            min="50"
            max="100"
            disabled={isLoading}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2">Maximum iterations:</label>
          <input
            type="number"
            value={maxIterations}
            onChange={(e) => setMaxIterations(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
            min="5"
            max="5000"
            disabled={isLoading}
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
        {isLoading && (
          <>
            <button
              onClick={handleCancel}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Cancel
            </button>
            <div className="flex-1 my-auto relative h-6 bg-gray-200 rounded">
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded"
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs">
                {progressPercentage}%
              </div>
            </div>
          </>
        )}
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
        <label className="block mb-2">Analysis Results:</label>
        <pre className="w-full p-3 border border-gray-300 rounded overflow-auto whitespace-pre-wrap bg-gray-50">
          {result}
        </pre>
      </div>
    </div>
  );
}
