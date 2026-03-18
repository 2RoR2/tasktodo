import { getDueDateMeta } from '../utils/todoDate'
import type { Todo } from '../types/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const dueDateMeta = getDueDateMeta(todo.dueDate)

  return (
    <div className={`todo-item ${todo.done ? 'done' : ''}`}>
      <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
      <span className="todo-text">{todo.text}</span>
      {dueDateMeta && (
        <div className={`due-date-chip ${dueDateMeta.tone}`}>
          <strong>{dueDateMeta.relativeLabel}</strong>
          <span>{dueDateMeta.absoluteLabel}</span>
        </div>
      )}
      <small className={todo.priority}>{todo.priority}</small>
      <button type="button" onClick={() => onDelete(todo.id)} aria-label={`Delete ${todo.text}`}>
        x
      </button>
    </div>
  )
}

export default TodoItem
