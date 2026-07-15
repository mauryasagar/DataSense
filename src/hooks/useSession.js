import { useEffect, useState } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'datasense-session-db';
const STORE_NAME = 'session-store';

/**
 * Initializes and retrieves the IndexedDB instance
 */
async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
}

export function useSession() {
  const [restoredSession, setRestoredSession] = useState(null);
  const [restoring, setRestoring] = useState(true);

  // Load session from IndexedDB on hook initialization
  useEffect(() => {
    async function load() {
      try {
        const db = await getDB();
        const session = await db.get(STORE_NAME, 'current');
        if (session) {
          setRestoredSession(session);
        }
      } catch (err) {
        console.error("Failed to load session from IndexedDB:", err);
      } finally {
        setRestoring(false);
      }
    }
    load();
  }, []);

  /**
   * Persists active workspace session to IndexedDB
   * @param {string} fileName 
   * @param {string} fileType 
   * @param {Object} parsedData 
   * @param {Array<Object>} chatHistory 
   * @param {Object} extra 
   */
  const saveSession = async (fileName, fileType, parsedData, chatHistory = [], extra = {}) => {
    try {
      const db = await getDB();

      // Strip raw rows from persisted data — they can be 10-50MB and will crash the tab.
      // Users will be prompted to re-drop the file to restore full analysis capability.
      // All pre-computed stats (EDA, column types, AI context) are preserved for chat history display.
      const lightParsedData = parsedData ? {
        columns: parsedData.columns,
        columnTypes: parsedData.columnTypes,
        edaResult: parsedData.edaResult,
        aiContext: parsedData.aiContext,
        fullText: parsedData.fullText,   // PDF text (usually small)
        cells: parsedData.cells,          // Notebook cells (usually small)
        // rows intentionally omitted
      } : null;

      const sessionObj = {
        fileName,
        fileType,
        parsedData: lightParsedData,
        chatHistory,
        extra,
        savedAt: Date.now(),
        version: 1
      };
      await db.put(STORE_NAME, sessionObj, 'current');
    } catch (err) {
      console.error("Failed to save session to IndexedDB:", err);
    }
  };

  /**
   * Clears the current saved session from IndexedDB
   */
  const clearSession = async () => {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, 'current');
      setRestoredSession(null);
    } catch (err) {
      console.error("Failed to clear session from IndexedDB:", err);
    }
  };

  return {
    restoredSession,
    restoring,
    saveSession,
    clearSession
  };
}
