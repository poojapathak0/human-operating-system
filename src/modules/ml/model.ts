import type { ModelParams } from './types';

function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }

export function predictProb(x: number[], params: ModelParams): number {
  const { weights: w, bias: b } = params;
  const dot = x.reduce((s, xi, i) => s + xi * (w[i] || 0), b);
  return sigmoid(dot);
}

export function trainLogistic(
  X: number[][],
  y: number[],
  init: ModelParams | null,
  opts: { lr?: number; epochs?: number; l2?: number }
): ModelParams {
  const lr = opts.lr ?? 0.05;
  const epochs = opts.epochs ?? 120;
  const l2 = opts.l2 ?? 0.0001;
  const dim = X[0]?.length ?? 0;
  let w = init?.weights?.slice() ?? new Array(dim).fill(0);
  let b = init?.bias ?? 0;
  for (let ep = 0; ep < epochs; ep++) {
    let db = 0; const dw = new Array(dim).fill(0);
    for (let i = 0; i < X.length; i++) {
      const p = predictProb(X[i], { id: 'tmp', weights: w, bias: b });
      const err = (p - y[i]);
      db += err;
      for (let j = 0; j < dim; j++) dw[j] += err * X[i][j];
    }
    // update with L2 regularization
    b -= lr * (db / X.length);
    for (let j = 0; j < dim; j++) w[j] -= lr * ((dw[j] / X.length) + l2 * w[j]);
  }
  return { id: init?.id || 'moodRiskV1', weights: w, bias: b, lastTrainedAt: Date.now() };
}
