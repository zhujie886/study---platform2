import { Hands, Results } from '@mediapipe/hands';

export type Gesture = 'sphere' | 'text' | 'torus' | 'star' | 'heart' | 'none';

class GestureService {
  private hands: Hands | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    this.hands = new Hands({
      locateFile: (file) => `https://unpkg.com/@mediapipe/hands/${file}`,
    });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    await this.hands.initialize();
    this.isInitialized = true;
  }

  // ? 修复：改为同步方法，由外部控制调用
  async processFrame(videoElement: HTMLVideoElement, callback: (gesture: Gesture, landmarks?: any) => void) {
    if (!this.hands || videoElement.readyState < 2) return;
    this.hands.onResults((results: Results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const gesture = this.detectGestureRule(landmarks);
        callback(gesture, landmarks);
      } else {
        callback('none', null);
      }
    });
    await this.hands.send({ image: videoElement });
  }

  private detectGestureRule(lm: any[]): Gesture {
    const isStraight = (tipIdx: number, pipIdx: number) => {
        const dist = Math.sqrt(Math.pow(lm[tipIdx].x - lm[pipIdx].x, 2) + Math.pow(lm[tipIdx].y - lm[pipIdx].y, 2));
        return dist > 0.1;
    };
    const isThumbUp = () => {
         return lm[4].y < lm[3].y && lm[4].y < lm[2].y;
    }

    const thumb = isThumbUp();
    const index = isStraight(8, 6);
    const middle = isStraight(12, 10);
    const ring = isStraight(16, 14);
    const pinky = isStraight(20, 18);

    if (index && middle && !ring && !pinky) return 'text';
    if (index && !middle && !ring && !pinky && !thumb) return 'star';
    if (thumb && !index && !middle && !ring && !pinky) return 'heart';
    if (!index && !middle && !ring && !pinky) return 'torus';
    if (index && middle && ring && pinky) return 'sphere';
    return 'none';
  }
}

export const gestureService = new GestureService();


