export type TodoPriority = 'low' | 'medium' | 'high'

export interface Todo {
  id: number
  text: string
  done: boolean
  priority: TodoPriority
  dueDate: string | null
}
