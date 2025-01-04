'use client';

import React, { useState, useEffect, useRef } from 'react';
import AiAudioSpectrum from './AiAudioSpectrum';

type Props = {
  audioData: string | null;  // AI音声の文字列データ (nullの場合は再生しない)
  textResponse?: string;     // AIのテキスト応答があれば表示したい場合
  onAudioEnded?: () => void; // 再生終了時に呼び出すコールバック (任意)
};

const AiVoiceVisualizer: React.FC<Props> = ({
  audioData,
  textResponse,
  onAudioEnded
}) => {
  // 再生中の Audio オブジェクト
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // 「直近で再生した音声データ」を覚えておいて、同じデータの連続再生を防ぐ
  const lastPlayedData = useRef<string | null>(null);

  useEffect(() => {
    // 音声データが無い場合は再生せずにクリア
    if (!audioData) {
      setAudio(null);
      return;
    }

    // 同じ音声データなら再度再生しない
    if (audioData === lastPlayedData.current) {
      console.log('同じ音声データなので再生をスキップします。');
      return;
    }
    lastPlayedData.current = audioData;

    // Blob生成 → Audio オブジェクトを作る
    const audioBlob = new Blob(
      [new Uint8Array(audioData.split('').map((c) => c.charCodeAt(0)))],
      { type: 'audio/mpeg' }
    );
    const audioElement = new Audio(URL.createObjectURL(audioBlob));

    // ▼ ここで音声速度を1.5倍に設定
    audioElement.playbackRate = 1.5;

    // 終了イベントでコールバックを呼び出し
    audioElement.addEventListener('ended', () => {
      onAudioEnded?.();
    });

    // 自動再生
    audioElement.play().catch(err => {
      console.warn('Audio autoplay failed:', err);
    });

    // State に保存 (AiAudioSpectrum などで使用)
    setAudio(audioElement);

    // アンマウント時にクリーンアップ
    return () => {
      audioElement.pause();
      audioElement.src = '';
    };
  }, [audioData, onAudioEnded]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* AIのテキスト応答を表示 */}
      {textResponse && (
        <div className="text-white text-center">
          <p>{textResponse}</p>
        </div>
      )}

      {/* スペクトラム描画コンポーネント (例: AiAudioSpectrum.tsx) */}
      <AiAudioSpectrum audio={audio} />
    </div>
  );
};

export default AiVoiceVisualizer;
