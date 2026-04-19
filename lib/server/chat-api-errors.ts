export function getChatErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getChatErrorStatus(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('authoriz') || normalized.includes('авториза')) {
    return 401;
  }

  if (normalized.includes('access denied') || normalized.includes('доступ')) {
    return 403;
  }

  if (normalized.includes('not found') || normalized.includes('не найден')) {
    return 404;
  }

  if (normalized.includes('rate limit')) {
    return 429;
  }

  return 400;
}
