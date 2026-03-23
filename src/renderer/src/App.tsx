import { useState, useEffect } from 'react'
import Header from './components/Header'
import ProgressBar from './components/ProgressBar'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'
import UpdatePanel from './components/UpdatePanel'
import './App.css'
import type { Todo, TodoPriority } from './types/todo'
import type { UpdateStatus } from '../../shared/updater'

const normalizeTodo = (
  todo: Partial<Todo> & Pick<Todo, 'id' | 'text' | 'done' | 'priority'>
): Todo => {
  return {
    id: todo.id,
    text: todo.text,
    done: todo.done,
    priority: todo.priority,
    dueDate: typeof todo.dueDate === 'string' && todo.dueDate.length > 0 ? todo.dueDate : null
  }
}

function App(): React.ReactElement {
  const [appVersion, setAppVersion] = useState('...')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    stage: 'idle',
    currentVersion: '...',
    message: 'Waiting to check for updates.'
  })

  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos')

    if (!saved) return []

    try {
      const parsedTodos = JSON.parse(saved) as Array<
        Partial<Todo> & Pick<Todo, 'id' | 'text' | 'done' | 'priority'>
      >

      if (!Array.isArray(parsedTodos)) return []

      return parsedTodos.map(normalizeTodo)
    } catch {
      return []
    }
  })

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return JSON.parse(saved)
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Save todos
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  // Save theme and update body class
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    document.body.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Listen to system theme changes
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent): void => setDarkMode(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadAppMeta = async (): Promise<void> => {
      const [version, status] = await Promise.all([window.api.getAppVersion(), window.api.getUpdateStatus()])

      if (!isMounted) return

      setAppVersion(version)
      setUpdateStatus(status)
    }

    void loadAppMeta()

    const unsubscribe = window.api.onUpdateStatusChanged((status) => {
      if (!isMounted) return
      setUpdateStatus(status)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const addTodo = (text: string, priority: TodoPriority, dueDate: string | null): void => {
    setTodos([...todos, { id: Date.now(), text, done: false, priority, dueDate }])
  }

  const toggleTodo = (id: number): void =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const deleteTodo = (id: number): void => setTodos(todos.filter((t) => t.id !== id))

  const completed = todos.filter((t) => t.done).length
  const total = todos.length
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
      <UpdatePanel
        appVersion={appVersion}
        status={updateStatus}
        onCheckForUpdates={() => window.api.checkForUpdates()}
        onInstallUpdate={() => window.api.installUpdate()}
      />

      {total > 0 && <ProgressBar progress={progress} />}

      <TodoInput onAdd={addTodo} />

      <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
    </div>
  )
}

export default App
