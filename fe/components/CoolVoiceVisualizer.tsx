'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResult[];
};

type Props = {
  /** 中間結果を随時受け取りたい場合 */
  onTranscript: (transcript: string) => void;
  /** 録音停止時に最終的な文字列が確定したら呼ばれる */
  onTranscriptEnd: (transcript: string) => Promise<void>;
  /** AIが音声を再生中なら録音を開始しないなどの制御用 */
  isAiResponsePlaying: boolean;
};

const CoolVoiceVisualizer: React.FC<Props> = ({
  onTranscript,
  onTranscriptEnd,
  isAiResponsePlaying
}) => {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * 音声認識インスタンスを作成
   */
  const createSpeechRecognitionInstance = useCallback(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return null;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newInterim = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinal += result[0].transcript;
        } else {
          newInterim += result[0].transcript;
        }
      }

      if (newFinal) {
        setFinalTranscript(prev => prev + newFinal);
      }
      setInterimTranscript(newInterim);

      // 中間 + 確定文をあわせて親に送る
      onTranscript(finalTranscript + newFinal + newInterim);
    };

    recognition.onend = () => {
      console.log('SpeechRecognition ended.');
      // 「無音で切れた」等の場合は再スタート
      // ただしユーザーが停止ボタンを押した場合は isListening = false → 再スタートしない
      if (isListening) {
        console.log('Auto-restart speech recognition...');
        recognition.start();
      }
    };

    recognition.onerror = (event) => {
      console.error('SpeechRecognition Error:', event.error);
      if (event.error === 'aborted') {
        console.log('Recognition aborted.');
      } else {
        console.log('An unexpected error occurred:', event.error);
      }
    };

    return recognition;
  }, [isListening, onTranscript, finalTranscript]);

  /**
   * 録音開始
   */
  const startListening = useCallback(async () => {
    if (isListening || isAiResponsePlaying) {
      console.log('Cannot start listening. Already listening or AI response is playing.');
      return;
    }

    recognitionRef.current = createSpeechRecognitionInstance();
    if (!recognitionRef.current) {
      console.error('SpeechRecognition not initialized.');
      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);

      recognitionRef.current.start();
      console.log('SpeechRecognition started.');
    } catch (error) {
      console.error('Failed to access microphone:', error);
    }
  }, [isListening, isAiResponsePlaying, createSpeechRecognitionInstance]);

  /**
   * 録音停止
   */
  const stopListening = useCallback(async () => {
    setIsListening(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 最終的な文字列をまとめて親に渡す
    const finalText = finalTranscript + interimTranscript;
    await onTranscriptEnd(finalText);

    // 次の録音に備えクリア
    setFinalTranscript('');
    setInterimTranscript('');
  }, [finalTranscript, interimTranscript, onTranscriptEnd]);

  /**
   * アンマウント時のクリーンアップ
   */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* interimTranscript（中間結果）の簡易表示（任意） */}
      {interimTranscript && (
        <div className="text-white text-center">
          中間認識結果: {interimTranscript}
        </div>
      )}

      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isAiResponsePlaying} 
        className={`px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : isAiResponsePlaying
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isListening ? '停止' : '開始'}
      </button>
    </div>
  );
};

export default CoolVoiceVisualizer;
