const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;

  const user = users.find(user => user.username === username);

  if(!user)
    return response.status(400).json({error: "User not found" });
  
  request.user = user;
  
  next();
}

function verifyDuplicatedUsername(request,response, next) {
  const {username} = request.body;

  const invalidUsername = users.some(user => user.username === username);

  if(invalidUsername)
    return response.status(400).json({error: "User already exists" });

  next();
}

function verifyTodoExists(request, response, next) {
  const {user} =  request;
  const {id} = request.params;

  const todo = user.todos.find(todo => todo.id === id);
  
  if(!todo)
    return response.status(404).json({error: "Todo no exists" });

  request.todo = todo;
  next();
}

app.post('/users', verifyDuplicatedUsername, (request, response) => {
  const {name, username} = request.body;
  const id = uuidv4();

  const user = {
    id,
    name,
    username,
    todos: []
  };

  users.push(user);

  return response.status(201).send(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {todos} = request.user;

  return response.send(todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {title, deadline} = request.body;
  const {user} = request;
  const id = uuidv4();

  const todo = {
    id,
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(todo);

  return response.status(201).send(todo);
});

app.put('/todos/:id', checksExistsUserAccount, verifyTodoExists, (request, response) => {
  const {user} = request;
  let {todo} = request;
  const {title, deadline} = request.body;

  todo = {
    ...todo,
    title,
    deadline: new Date(deadline)
  };

  return response.send(todo);  
});

app.patch('/todos/:id/done', checksExistsUserAccount, verifyTodoExists, (request, response) => {
  const {user} = request;
  const {id} = request.params;

  let todo = user.todos.find(todo => todo.id === id);

  todo = {
    ...todo,
    done: true
  };

  return response.send(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, verifyTodoExists, (request, response) => {
  const {user} = request;
  const {id} = request.params;

  user.todos = user.todos.filter(todo => todo.id !== id);

  return response.status(204).send();
});

module.exports = app;