export function buildMeetingLink(roomName: string) {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('room', roomName)
  return url.toString()
}

export function getRoomFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('room')
}

export async function copyMeetingLink(roomName: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildMeetingLink(roomName))
    return true
  } catch {
    return false
  }
}
