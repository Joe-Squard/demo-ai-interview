'use client';

import React, { useState } from 'react';
import CoolVoiceVisualizer from '../components/CoolVoiceVisualizer';
import AiVoiceVisualizer from '../components/AiVoiceVisualizer';
import TranscriptDisplay from '../components/TranscriptDisplay';

export default function Home() {
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('AIの応答がここに表示されます。');
  const [aiAudioData, setAiAudioData] = useState<string | null>(null);

  // AI音声が再生中かどうか
  const [isAiResponsePlaying, setIsAiResponsePlaying] = useState(false);

  /**
   * AIに問い合わせ → テキスト応答 + 音声データを取得
   */
  const generateAiResponse = async (transcript: string) => {
    if (!transcript.trim()) {
      console.log('空文字なのでAPIに送信しません');
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/generate-response/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error('AI応答生成APIの呼び出しに失敗しました');
      }

      const data = await response.json();
      setAiResponse(data.text_response || '');
      setAiAudioData(data.audio_data || null);

      // 再生中フラグを立てる
      setIsAiResponsePlaying(true);
    } catch (error) {
      console.error(error);
      setAiResponse('エラーが発生しました。');
    }
  };

  /**
   * 録音停止後に確定テキストが来る
   */
  const handleTranscriptEnd = async (transcript: string) => {
    if (isAiResponsePlaying) {
      console.log('AI応答再生中です。しばらくお待ちください。');
      return;
    }
    setUserTranscript(transcript);
    await generateAiResponse(transcript);
  };

  /**
   * AI音声の再生終了時
   */
  const handleAudioEnded = () => {
    console.log('AI音声再生が終了しました。');
    setIsAiResponsePlaying(false);

    // 同じ audioData で再レンダーされても再生されないようにしたければクリア
    setAiAudioData(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-white">DEMO</h1>
      <div className="w-full max-w-7xl">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg flex flex-col md:flex-row gap-8">

          {/* 左: ユーザー音声録音 */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 items-center">
            <h2 className="text-2xl font-semibold text-white">ユーザー音声</h2>
            <CoolVoiceVisualizer
              onTranscript={setUserTranscript}
              onTranscriptEnd={handleTranscriptEnd}
              isAiResponsePlaying={isAiResponsePlaying}
            />
            <TranscriptDisplay
              title="あなたの発言"
              content={userTranscript}
              className="w-full"
            />
          </div>

          {/* 右: AIの応答 (テキスト + 音声) */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 items-center">
            <h2 className="text-2xl font-semibold text-white">AI応答</h2>
            <AiVoiceVisualizer
              audioData={aiAudioData}
              textResponse={aiResponse}
              onAudioEnded={handleAudioEnded}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
