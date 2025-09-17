/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect, useMemo } from 'react';
import { dataURLtoFile, fileToDataURL } from '../utils/fileUtils';

/**
 * @description Gerencia o histórico de edição de imagens (pilha de desfazer/refazer) e o persiste no LocalStorage.
 * @param {() => void} onStateChange - Callback acionado nas mudanças de histórico para limpar estados de edição relacionados (máscaras, cortes, etc.).
 * @returns {object} O estado do histórico e as ações para manipulá-lo.
 */
export const useHistoryState = (onStateChange: () => void) => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);

  // Carrega do LocalStorage na montagem inicial
  useEffect(() => {
    const loadData = async () => {
      setIsHistoryLoading(true);
      try {
        const savedDataJSON = localStorage.getItem('pixshopHistory');
        if (savedDataJSON) {
          const savedData = JSON.parse(savedDataJSON);
          if (savedData.history && typeof savedData.historyIndex === 'number' && Array.isArray(savedData.history)) {
            const loadedFiles = await Promise.all(
                savedData.history.map((item: { name: string, dataUrl: string }) => dataURLtoFile(item.dataUrl, item.name))
            );
            setHistory(loadedFiles);
            setHistoryIndex(savedData.historyIndex);
          }
        }
      } catch (e) {
        console.error("Falha ao carregar o histórico do LocalStorage", e);
        localStorage.removeItem('pixshopHistory');
      } finally {
        setIsHistoryLoading(false);
      }
    };
    loadData();
  }, []);

  // Salva no LocalStorage sempre que o histórico muda
  useEffect(() => {
    if (isHistoryLoading) return;

    const saveData = async () => {
      if (history.length > 0 && history[0].size > 0) {
        try {
          const serializableHistory = await Promise.all(history.map(async (file) => {
            const dataUrl = await fileToDataURL(file);
            return { name: file.name, dataUrl };
          }));
          const dataToStore = {
            history: serializableHistory,
            historyIndex: historyIndex,
          };
          localStorage.setItem('pixshopHistory', JSON.stringify(dataToStore));
        } catch (error) {
          console.error("Falha ao salvar o histórico no LocalStorage", error);
        }
      } else {
        localStorage.removeItem('pixshopHistory');
      }
    };
    saveData();
  }, [history, historyIndex, isHistoryLoading]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const currentImage = useMemo(() => history[historyIndex] ?? null, [history, historyIndex]);
  const originalImage = useMemo(() => history[0] ?? null, [history]);

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onStateChange();
  }, [history, historyIndex, onStateChange]);
  
  const setInitialImage = useCallback((file: File) => {
      const newHistory = [file];
      setHistory(newHistory);
      setHistoryIndex(0);
      onStateChange();
  }, [onStateChange]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    onStateChange();
  }, [onStateChange]);

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      onStateChange();
    }
  }, [canUndo, historyIndex, onStateChange]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      onStateChange();
    }
  }, [canRedo, historyIndex, onStateChange]);

  const resetHistory = useCallback(() => {
    if (history.length > 0 && historyIndex > 0) {
        setHistory([history[0]]);
        setHistoryIndex(0);
        onStateChange();
    }
  }, [history, historyIndex, onStateChange]);

  return {
    currentImage,
    originalImage,
    canUndo,
    canRedo,
    isHistoryLoading,
    addImageToHistory,
    setInitialImage,
    clearHistory,
    undo,
    redo,
    resetHistory,
  };
};
