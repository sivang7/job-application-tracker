import { describe, expect, it } from 'vitest';
import { cvCompareUrl, cvFileUrl, cvViewerUrl } from './api';

describe('cv URL helpers', () => {
  it('builds proxied file path', () => {
    expect(cvFileUrl('version-123')).toBe('/api/cv-versions/version-123/file');
  });

  it('builds download file path', () => {
    expect(cvFileUrl('version-123', { download: true })).toBe(
      '/api/cv-versions/version-123/file?download=1',
    );
  });

  it('builds viewer page path', () => {
    expect(cvViewerUrl('version-123')).toBe('/cvs/view/version-123');
  });

  it('builds compare page path with query params', () => {
    expect(cvCompareUrl('from-id', 'to-id')).toBe('/cvs/compare?from=from-id&to=to-id');
  });
});
