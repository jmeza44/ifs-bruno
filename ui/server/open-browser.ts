export async function openBrowser(url: string): Promise<void> {
  const command =
    process.platform === 'win32'
      ? ['cmd', '/c', 'start', '', url]
      : process.platform === 'darwin'
        ? ['open', url]
        : ['xdg-open', url];

  Bun.spawn(command, { stdio: ['ignore', 'ignore', 'ignore'] });
}
