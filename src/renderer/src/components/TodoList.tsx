import { AgGridReact } from 'ag-grid-react'
import { ClientSideRowModelModule, ModuleRegistry, type ColDef, type ICellRendererParams } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import TodoItem from './TodoItem'
import type { Todo } from '../types/todo'
import { compareTodos } from '../utils/todoDate'

ModuleRegistry.registerModules([ClientSideRowModelModule])

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

interface TodoGridContext {
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

const TodoRowRenderer = ({
  data,
  context
}: ICellRendererParams<Todo, unknown, TodoGridContext>): React.ReactElement | null => {
  if (!data || !context) return null

  return <TodoItem todo={data} onToggle={context.onToggle} onDelete={context.onDelete} />
}

const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onDelete }) => {
  if (todos.length === 0) {
    return <p className="empty">No tasks yet</p>
  }

  const sortedTodos = [...todos].sort(compareTodos)
  const columnDefs: ColDef<Todo>[] = [
    {
      field: 'text',
      flex: 1,
      sortable: false,
      resizable: false,
      cellRenderer: TodoRowRenderer
    }
  ]

  return (
    <div className="todo-grid ag-theme-quartz">
      <AgGridReact<Todo>
        rowData={sortedTodos}
        columnDefs={columnDefs}
        context={{ onToggle, onDelete }}
        headerHeight={0}
        rowHeight={84}
        domLayout="autoHeight"
        suppressCellFocus
        suppressHeaderFocus
        suppressMovableColumns
        suppressColumnVirtualisation
        suppressRowHoverHighlight
        defaultColDef={{
          sortable: false,
          filter: false,
          editable: false
        }}
        getRowId={(params) => params.data.id.toString()}
      />
    </div>
  )
}

export default TodoList
