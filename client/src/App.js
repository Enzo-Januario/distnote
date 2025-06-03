import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

const socket = io();

function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    axios.get('/notes').then(res => setNotes(res.data));

    socket.on('new_note', note => {
      setNotes(prev => [...prev, note]);
    });

    socket.on('edit_note', updatedNote => {
      setNotes(prev =>
        prev.map(note => (note._id === updatedNote._id ? updatedNote : note))
      );
    });

    socket.on('delete_note', id => {
      setNotes(prev => prev.filter(note => note._id !== id));
    });

    return () => {
      socket.off('new_note');
      socket.off('edit_note');
      socket.off('delete_note');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingId) {
      await axios.put(`/notes/${editingId}`, { text: trimmed });
      setEditingId(null);
    } else {
      await axios.post('/notes', { text: trimmed });
    }

    setText('');
  };

  const handleEdit = (note) => {
    setText(note.text);
    setEditingId(note._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/notes/${id}`);
  };

  return (
    <div className="container">
      <h1>DistNote</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escreva sua anotação..."
        />
        <button type="submit">{editingId ? 'Atualizar' : 'Enviar'}</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setText('');
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <ul>
        {notes.map(note => (
          <li key={note._id}>
            {note.text}
            <div className="actions">
              <button onClick={() => handleEdit(note)}>✏️</button>
              <button onClick={() => handleDelete(note._id)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
