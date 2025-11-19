import { useState } from 'react';
import './App.css'; // 手順4で作るCSSを読み込み

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  // 1. Stateの定義
  const [todos, setTodos] = useState<Todo[]>([]); // TODOリスト
  const [inputVal, setInputVal] = useState<string>(""); // 入力フォームの値

  // 2. タスク追加機能
  const handleAddTodo = () => {
    if (inputVal === "") return; // 空文字なら何もしない
    
    const newTodo = {
      id: Date.now(), // 一意のIDとして現在時刻を使用
      text: inputVal,
      completed: false
    };
    
    setTodos([...todos, newTodo]); // 新しい配列を作成してセット
    setInputVal(""); // 入力欄をクリア
  };

  // 3. 完了/未完了の切り替え機能
  const toggleTodo = (id: number) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    setTodos(newTodos);
  };

  // 4. 削除機能
  const deleteTodo = (id: number) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
  };

  return (
    <div className="container">
      <h1>My Todo App</h1>
      
      {/* 入力エリア */}
      <div className="input-area">
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="タスクを入力..."
        />
        <button onClick={handleAddTodo}>追加</button>
      </div>

      {/* リスト表示エリア */}
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "completed" : ""}>
            <span onClick={() => toggleTodo(todo.id)}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="delete-btn">
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;