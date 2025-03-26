import uuid
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Todo Application")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Model for Todo items
class TodoItem(BaseModel):
    id: str
    title: str
    completed: bool


class TodoCreate(BaseModel):
    title: str


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None


# In-memory storage for todos
todos = []


@app.get("/api/todos", response_model=List[TodoItem])
async def get_todos():
    return todos


@app.post("/api/todos", response_model=TodoItem)
async def create_todo(todo: TodoCreate):
    new_todo = TodoItem(id=str(uuid.uuid4()), title=todo.title, completed=False)
    todos.append(new_todo)
    return new_todo


@app.get("/api/todos/{todo_id}", response_model=TodoItem)
async def get_todo(todo_id: str):
    for todo in todos:
        if todo.id == todo_id:
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")


@app.put("/api/todos/{todo_id}", response_model=TodoItem)
async def update_todo(todo_id: str, todo_update: TodoUpdate):
    for todo in todos:
        if todo.id == todo_id:
            if todo_update.title is not None:
                todo.title = todo_update.title
            if todo_update.completed is not None:
                todo.completed = todo_update.completed
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")


@app.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: str):
    for i, todo in enumerate(todos):
        if todo.id == todo_id:
            del todos[i]
            return {"message": "Todo deleted successfully"}
    raise HTTPException(status_code=404, detail="Todo not found")


# Mount the static files directory
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
