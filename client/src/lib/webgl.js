export function canUseWebGL() {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');

    if (!gl) return false;

    // Some sandboxes expose a context that still cannot render (e.g. GL_RENDERER = Disabled)
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      if (/disabled|swiftshader|null/i.test(renderer)) return false;
    }

    return true;
  } catch {
    return false;
  }
}
