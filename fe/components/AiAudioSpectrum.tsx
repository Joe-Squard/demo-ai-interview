'use client';

import React, { useEffect, useRef } from 'react';

/** clamp: 値を min~max に収める */
function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

type Props = {
  audio: HTMLAudioElement | null;
};

const AiAudioSpectrum: React.FC<Props> = ({ audio }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centerImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // 背景が透過PNGの center.png を読み込み (public/center.png)
    const img = new Image();
    img.src = '/center.png';
    centerImgRef.current = img;
  }, []);

  useEffect(() => {
    if (!audio) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();

    /** 大きいほど周波数分解能が高いがCPU負荷が増える */
    analyser.fftSize = 1024;
    const bufferLength = analyser.frequencyBinCount; // 例: 256
    const dataArray = new Uint8Array(bufferLength);

    // 波形スムージング用のバッファ
    const smoothData = new Float32Array(bufferLength);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // 基本円半径
    const baseRadius = Math.min(W, H) * 0.3;
    // 波形の振幅
    const scale = 2.0;

    // 過剰に変形しないためのClamp設定
    const minRadius = baseRadius * 0.7;
    const maxRadius = baseRadius * 1.5;

    // 線のグラデーション (色はお好みで)
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(1, '#00ffff');

    /** 
     * Catmull-Romスプライン風ベジェを引くための
     * "previous" 頂点の座標を記憶する
     */
    let prevX = 0;
    let prevY = 0;

    function draw() {
      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // 背景クリア（透過）
      ctx.clearRect(0, 0, W, H);

      // ========== (1) 5点平均でノイズを減らす ==========
      for (let i = 0; i < bufferLength; i++) {
        let sum = 0;
        let count = 0;
        // i-2 ~ i+2 を合計
        for (let j = -2; j <= 2; j++) {
          const idx = (i + j + bufferLength) % bufferLength;
          sum += dataArray[idx];
          count++;
        }
        const avg = sum / count;
        smoothData[i] = avg;
      }

      // ========== (2) 上下対称(反対インデックス)との平均 ==========
      // これにより上部(音声周波数の後半)も動きやすくなる
      for (let i = 0; i < bufferLength; i++) {
        const opp = (i + bufferLength / 2) % bufferLength;
        const v1 = smoothData[i];
        const v2 = smoothData[opp];
        const mean = (v1 + v2) / 2;
        smoothData[i] = mean;
        smoothData[opp] = mean;
      }

      // ========== (3) Catmull-Rom風ベジェ曲線で円周を結ぶ ==========

      // 最初の点 (i=0) を計算し、moveTo
      {
        const angle0 = 0; // i=0 → 角度0 (右端)
        let r0 = baseRadius + smoothData[0] * scale;
        r0 = clamp(r0, minRadius, maxRadius);
        prevX = W / 2 + r0 * Math.cos(angle0);
        prevY = H / 2 + r0 * Math.sin(angle0);

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
      }

      for (let i = 1; i < bufferLength; i++) {
        // angle
        const angle = (2 * Math.PI * i) / bufferLength;
        let r = baseRadius + smoothData[i] * scale;
        r = clamp(r, minRadius, maxRadius);

        const x = W / 2 + r * Math.cos(angle);
        const y = H / 2 + r * Math.sin(angle);

        // Catmull-Romっぽく、"制御点" を prev と 現在の中間点に
        const cx = (prevX + x) / 2;
        const cy = (prevY + y) / 2;
        // quadraticCurveTo(controlX, controlY, endX, endY)
        ctx.quadraticCurveTo(prevX, prevY, cx, cy);

        // 次に備えて更新
        prevX = x;
        prevY = y;
      }

      // 最後、最初の頂点 (i=0 の位置) に戻して閉じる
      // i=0 の位置(angle0=0)を再計算
      {
        let r0 = baseRadius + smoothData[0] * scale;
        r0 = clamp(r0, minRadius, maxRadius);
        const x0 = W / 2 + r0 * Math.cos(0);
        const y0 = H / 2 + r0 * Math.sin(0);
        const cx = (prevX + x0) / 2;
        const cy = (prevY + y0) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cx, cy);
      }

      ctx.closePath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // ========== (4) 中心画像を描画 ==========
      const centerImg = centerImgRef.current;
      if (centerImg && centerImg.width > 0 && centerImg.height > 0) {
        const imgW = centerImg.width;
        const imgH = centerImg.height;
        const cx = (W - imgW) / 2;
        const cy = (H - imgH) / 2;
        ctx.drawImage(centerImg, cx, cy);
      }
    }

    draw();

    return () => {
      audioContext.close();
    };
  }, [audio]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      style={{
        backgroundColor: 'transparent',
        width: '400px',
        height: '400px',
      }}
    />
  );
};

export default AiAudioSpectrum;
