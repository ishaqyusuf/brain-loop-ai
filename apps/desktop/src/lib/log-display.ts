export function logFileNameFromPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }
  const fileName = path.split(/[\\/]/).pop();
  if (!fileName?.endsWith(".log")) {
    return null;
  }
  return fileName;
}
