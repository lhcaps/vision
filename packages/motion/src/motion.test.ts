import { describe, it, expect } from 'vitest';
import { motionTokens, pipelineMotion, stateMotion } from './index';

describe('motionTokens', () => {
  it('has springFast with correct stiffness and damping', () => {
    expect(motionTokens.springFast).toEqual({ type: 'spring', stiffness: 420, damping: 32 });
  });

  it('has springSoft with correct stiffness and damping', () => {
    expect(motionTokens.springSoft).toEqual({ type: 'spring', stiffness: 220, damping: 26 });
  });

  it('has springMorph with correct stiffness and damping', () => {
    expect(motionTokens.springMorph).toEqual({ type: 'spring', stiffness: 280, damping: 28 });
  });

  it('has springSnap with correct stiffness and damping', () => {
    expect(motionTokens.springSnap).toEqual({ type: 'spring', stiffness: 400, damping: 36 });
  });

  it('has springSnappy with correct stiffness and damping', () => {
    expect(motionTokens.springSnappy).toEqual({ type: 'spring', stiffness: 320, damping: 30 });
  });

  it('has easeOut cubic bezier', () => {
    expect(motionTokens.easeOut).toEqual([0.22, 1, 0.36, 1]);
  });

  it('has easeInOut cubic bezier', () => {
    expect(motionTokens.easeInOut).toEqual([0.65, 0, 0.35, 1]);
  });

  it('has easeScan cubic bezier equal to easeOut', () => {
    expect(motionTokens.easeScan).toEqual(motionTokens.easeOut);
  });

  it('has easeDraw cubic bezier', () => {
    expect(motionTokens.easeDraw).toEqual([0.32, 0.72, 0, 1]);
  });

  it('has durationInstant of 0', () => {
    expect(motionTokens.durationInstant).toBe(0);
  });

  it('has durationFast of 0.12', () => {
    expect(motionTokens.durationFast).toBe(0.12);
  });

  it('has durationBase of 0.2', () => {
    expect(motionTokens.durationBase).toBe(0.2);
  });

  it('has durationSlow of 0.36', () => {
    expect(motionTokens.durationSlow).toBe(0.36);
  });

  it('has durationMorph of 0.16', () => {
    expect(motionTokens.durationMorph).toBe(0.16);
  });
});

describe('pipelineMotion', () => {
  it('has nodePulse animation', () => {
    expect(pipelineMotion.nodePulse).toBeDefined();
    expect(pipelineMotion.nodePulse.duration).toBe(1.2);
    expect(pipelineMotion.nodePulse.ease).toBe('easeInOut');
  });

  it('has edgeFlow animation', () => {
    expect(pipelineMotion.edgeFlow).toBeDefined();
    expect(pipelineMotion.edgeFlow.duration).toBe(0.8);
    expect(pipelineMotion.edgeFlow.ease).toBe('linear');
  });

  it('has nodeComplete animation', () => {
    expect(pipelineMotion.nodeComplete).toBeDefined();
    expect(pipelineMotion.nodeComplete.duration).toBe(0.3);
  });

  it('has nodeError animation', () => {
    expect(pipelineMotion.nodeError).toBeDefined();
    expect(pipelineMotion.nodeError.duration).toBe(0.4);
  });
});

describe('stateMotion', () => {
  it('has bbox state classes', () => {
    expect(stateMotion.bbox).toBeDefined();
    expect(stateMotion.bbox.idle).toBeDefined();
    expect(stateMotion.bbox.drawing).toBeDefined();
    expect(stateMotion.bbox.selected).toBeDefined();
    expect(stateMotion.bbox.scanning).toBeDefined();
    expect(stateMotion.bbox.locked).toBeDefined();
    expect(stateMotion.bbox.lowConfidence).toBeDefined();
    expect(stateMotion.bbox.rejected).toBeDefined();
  });

  it('has pipelineNode state classes', () => {
    expect(stateMotion.pipelineNode).toBeDefined();
    expect(stateMotion.pipelineNode.idle).toBeDefined();
    expect(stateMotion.pipelineNode.queued).toBeDefined();
    expect(stateMotion.pipelineNode.active).toBeDefined();
    expect(stateMotion.pipelineNode.succeeded).toBeDefined();
    expect(stateMotion.pipelineNode.failed).toBeDefined();
  });

  it('bbox states return string class names', () => {
    for (const [, cls] of Object.entries(stateMotion.bbox)) {
      expect(typeof cls).toBe('string');
      expect(cls.length).toBeGreaterThan(0);
    }
  });

  it('pipelineNode states return string class names', () => {
    for (const [, cls] of Object.entries(stateMotion.pipelineNode)) {
      expect(typeof cls).toBe('string');
      expect(cls.length).toBeGreaterThan(0);
    }
  });
});
