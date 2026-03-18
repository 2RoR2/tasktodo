interface HeaderProps {
  darkMode: boolean
  toggleDarkMode: () => void
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  return (
    <div className="header">
      <h1>Task To Do</h1>
      <button className="theme-toggle-btn" onClick={toggleDarkMode}>
        {darkMode ? '🌙' : '☀️'}
      </button>
    </div>
  )
}

export default Header
