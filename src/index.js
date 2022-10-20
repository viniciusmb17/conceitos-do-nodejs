const express = require('express')
const cors = require('cors')

const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(cors())
app.use(express.json())

const users = []

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const user = users.find((user) => user.username === username)

  if (!user) {
    return response.status(404).json({ error: 'User not found' })
  }

  request.user = user

  return next()
}

function checkExistsUserTodo(request, response, next) {
  const { user } = request
  const { id } = request.params
  const todo = user.todos.find((todo) => id === todo.id)

  if (!todo) {
    return response
      .status(404)
      .json({ error: `The TODO ID '${id}' does not exist!` })
  }

  request.todo = todo

  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const usernameAlreadyExists = users.some((user) => user.username === username)

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: 'Username already exists!' })
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  }

  users.push(user)
  return response.status(201).json(user)
})

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.status(200).json(user.todos)
})

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { title, deadline } = request.body

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  user.todos.push(todo)

  return response.status(201).json(todo)
})

app.put(
  '/todos/:id',
  checksExistsUserAccount,
  checkExistsUserTodo,
  (request, response) => {
    const { todo } = request
    const { title, deadline } = request.body

    todo.title = title
    todo.deadline = new Date(deadline)

    return response.status(201).json(todo)
  }
)

app.patch(
  '/todos/:id/done',
  checksExistsUserAccount,
  checkExistsUserTodo,
  (request, response) => {
    const { todo } = request

    todo.done = true

    return response.status(201).send()
  }
)

app.delete(
  '/todos/:id',
  checksExistsUserAccount,
  checkExistsUserTodo,
  (request, response) => {
    const { todo, user } = request

    const todoIndex = user.todos.findIndex(todoFind => todoFind.id === todo.id)

    user.todos.splice(todoIndex, 1)

    return response.status(204).send()
  }
)

module.exports = app
