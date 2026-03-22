import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow, parseISO } from 'date-fns'
import type { Todo } from '../types/todo'

const getParsedDate = (dueDate: string | null): Date | null => {
  if (!dueDate) return null

  const parsedDate = parseISO(dueDate)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export const compareTodos = (left: Todo, right: Todo): number => {
  if (left.done !== right.done) {
    return Number(left.done) - Number(right.done)
  }

  const leftDate = getParsedDate(left.dueDate)
  const rightDate = getParsedDate(right.dueDate)

  if (leftDate && rightDate) {
    const dateDifference = leftDate.getTime() - rightDate.getTime()
    if (dateDifference !== 0) return dateDifference
  } else if (leftDate || rightDate) {
    return leftDate ? -1 : 1
  }

  return right.id - left.id
}

export const getDueDateMeta = (
  dueDate: string | null
): {
  absoluteLabel: string
  relativeLabel: string
  tone: 'neutral' | 'upcoming' | 'overdue'
} | null => {
  const parsedDate = getParsedDate(dueDate)
  if (!parsedDate) return null

  if (isToday(parsedDate)) {
    return {
      absoluteLabel: format(parsedDate, 'MMM d, yyyy'),
      relativeLabel: 'Today',
      tone: 'upcoming'
    }
  }

  if (isTomorrow(parsedDate)) {
    return {
      absoluteLabel: format(parsedDate, 'MMM d, yyyy'),
      relativeLabel: 'Tomorrow',
      tone: 'upcoming'
    }
  }

  if (isPast(parsedDate)) {
    return {
      absoluteLabel: format(parsedDate, 'MMM d, yyyy'),
      relativeLabel: 'Overdue',
      tone: 'overdue'
    }
  }

  return {
    absoluteLabel: format(parsedDate, 'MMM d, yyyy'),
    relativeLabel: formatDistanceToNowStrict(parsedDate, { addSuffix: true }),
    tone: 'neutral'
  }
}
