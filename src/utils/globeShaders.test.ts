import { describe, expect, it } from 'vitest';
import { fragmentShaderSource, vertexShaderSource } from './globeShaders';
import globeWebGlSource from './globeWebGl.ts?raw';

function getDeclaredSymbols(
  source: string,
  expression: RegExp,
) {
  return [...source.matchAll(expression)].map((match) => match[1] ?? '');
}

function getReferenceCount(source: string, symbol: string) {
  return [...source.matchAll(new RegExp(`\\b${symbol}\\b`, 'g'))].length;
}

function getQuotedSymbols(source: string, prefix: string) {
  return [...source.matchAll(new RegExp(`'(${prefix}[A-Za-z0-9_]+)'`, 'g'))].map(
    (match) => match[1] ?? '',
  );
}

describe('globe shader contracts', () => {
  const shaderSource = `${vertexShaderSource}\n${fragmentShaderSource}`;
  const declaredUniforms = getDeclaredSymbols(
    shaderSource,
    /uniform\s+\w+\s+(u_[A-Za-z0-9_]+)/g,
  );
  const declaredAttributes = getDeclaredSymbols(
    vertexShaderSource,
    /attribute\s+\w+\s+(a_[A-Za-z0-9_]+)/g,
  );
  const lookedUpUniforms = getQuotedSymbols(globeWebGlSource, 'u_');
  const lookedUpAttributes = getQuotedSymbols(globeWebGlSource, 'a_');

  it('binds only uniforms that are declared and actually used', () => {
    for (const uniform of lookedUpUniforms) {
      expect(declaredUniforms).toContain(uniform);
      expect(getReferenceCount(shaderSource, uniform)).toBeGreaterThan(1);
    }
  });

  it('binds only attributes that are declared and actually used', () => {
    for (const attribute of lookedUpAttributes) {
      expect(declaredAttributes).toContain(attribute);
      expect(getReferenceCount(vertexShaderSource, attribute)).toBeGreaterThan(1);
    }
  });
});
