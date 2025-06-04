require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS: permita apenas seu frontend hospedado no Render
const io = new Server(server, {
  cors: {
    origin: 'https://distnote-frontend.onrender.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors({
  origin: 'https://distnote-frontend.onrender.com'
}));

app.use(express.json());

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

// Mongoose Model
const NoteSchema = new mongoose.Schema({ text: String });
const Note = mongoose.model('Note', NoteSchema);

// Rotas REST
app.get('/notes', async (req, res) => {
  const notes = await Note.find();
  res.json(notes);
});

app.post('/notes', async (req, res) => {
  const note = new Note({ text: req.body.text });
  await note.save();
  io.emit('new_note', note);
  res.status(201).json(note);
});

app.put('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const updated = await Note.findByIdAndUpdate(id, { text }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Nota não encontrada' });

    io.emit('edit_note', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar nota' });
  }
});

app.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Note.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Nota não encontrada' });

    io.emit('delete_note', id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar nota' });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Porta
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
