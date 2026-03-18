import { useState, useRef, useEffect } from 'react'
import type { TodoPriority } from '../types/todo'

interface TodoInputProps {
  onAdd: (text: string, priority: TodoPriority, dueDate: string | null) => void
}

const TodoInput: React.FC<TodoInputProps> = ({ onAdd }) => {
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const priorities: TodoPriority[] = ['low', 'medium', 'high']

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdd = (): void => {
    if (!input.trim()) return
    onAdd(input.trim(), priority, dueDate || null)
    setInput('')
    setPriority('medium')
    setDueDate('')
    setIsDropdownOpen(false)
  }

  return (
    <div className="input-row">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Task?"
      />

      <input
        className="date-input"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Due date"
      />

      <div className="custom-dropdown" ref={dropdownRef}>
        <button
          className={`dropdown-trigger priority-${priority}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          type="button"
        >
          <span className="priority-dot"></span>
          <span className="priority-label">{priority}</span>
          <span className={`chevron ${isDropdownOpen ? 'open' : ''}`}>▾</span>
        </button>

        {isDropdownOpen && (
          <div className="dropdown-options">
            {priorities.map((p) => (
              <div
                key={p}
                className={`dropdown-option priority-${p} ${priority === p ? 'active' : ''}`}
                onClick={() => {
                  setPriority(p)
                  setIsDropdownOpen(false)
                }}
              >
                <span className="priority-dot"></span>
                <span className="priority-label">{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleAdd} className="add-btn">
        Add
      </button>
    </div>
  )
}

export default TodoInput
