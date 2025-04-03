import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from '@aws-amplify/api';
import awsExports from './aws-exports';
import { listTodos } from './graphql/queries';
import { createTodo, deleteTodo, updateTodo } from './graphql/mutations';
import './App.css';

Amplify.configure(awsExports);

// Create the API client
const client = generateClient();

const App = () => {
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editData, setEditData] = useState(null); // Holds the todo being edited

  // Fetch todos from API
  async function fetchTodos() {
    try {
      const { data } = await client.graphql({ query: listTodos });
      setTodos(data?.listTodos?.items ?? []);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  }

  // Handle input change for both add & edit forms
  const handleChange = (e) => {
    if (editData) {
      setEditData({ ...editData, [e.target.name]: e.target.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Create a new todo
  async function handleCreateTodo(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await client.graphql({
        query: createTodo,
        variables: { input: formData },
      });
      setFormData({ name: '', description: '' }); // Reset form
      fetchTodos(); // Refresh the list
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  }

  // Delete a todo
  async function handleDeleteTodo(id) {
    try {
      await client.graphql({
        query: deleteTodo,
        variables: { input: { id } },
      });
      setTodos(todos.filter(todo => todo.id !== id)); // Remove from state
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }

  // Enable edit mode
  function handleEditStart(todo) {
    setEditData(todo);
  }

  // Update a todo
  async function handleUpdateTodo(e) {
    e.preventDefault();
    if (!editData.name.trim()) return;

    try {
      const { id, name, description } = editData;

      await client.graphql({
        query: updateTodo,
        variables: { input: { id, name, description } },
      });

      setEditData(null); // Exit edit mode
      fetchTodos(); // Refresh the list
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div className="container">
      <h1>Todo App</h1>

      {/* Form to Add Todo */}
      {!editData && (
        <form className="todo-form" onSubmit={handleCreateTodo}>
          <input
            type="text"
            name="name"
            placeholder="Todo Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            required
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />
          <button type="submit">Add Todo</button>
        </form>
      )}

      {/* Form to Edit Todo */}
      {editData && (
        <form className="todo-form" onSubmit={handleUpdateTodo}>
          <input
            type="text"
            name="name"
            placeholder="Edit Name"
            value={editData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Edit Description"
            value={editData.description}
            onChange={handleChange}
          />
          <button type="submit">Update Todo</button>
          <button className="cancel-btn" onClick={() => setEditData(null)}>Cancel</button>
        </form>
      )}

      {/* Todo List */}
      {todos.length === 0 ? (
        <p className="no-todos">No todos available.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              <span className="todo-text">
                {todo.name}: {todo.description}
              </span>
              <div className="button-group">
                <button className="edit-btn" onClick={() => handleEditStart(todo)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
