/**
 * 获取 public 目录下资源的完整路径（用于 GitHub Pages 部署）
 * @param path - 资源路径，如 '/home-bg.png'
 */
export function getPublicUrl(path: string): string {
  // 移除路径开头的斜杠
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // 使用 Vite 的 BASE_URL
  const base = import.meta.env.BASE_URL || '/';
  return base + cleanPath;
}
