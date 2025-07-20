# 🚀 FastAPI: Modern Python Web Framework

FastAPI is a modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints. It's built on top of Starlette (for web parts) and Pydantic (for data validation).

## ✨ Key Features & Why Use FastAPI?

*   **Fast:** Very high performance, on par with NodeJS and Go, thanks to Starlette and Pydantic. One of the fastest Python frameworks available.
*   **Fast to Code:** Increases development speed significantly (estimated 200% to 300%) due to its intuitive design and features.
*   **Fewer Bugs:** Reduces human-induced errors through automatic data validation and serialization powered by Pydantic type hints.
*   **Intuitive:** Great editor support (autocompletion everywhere) due to type hints. Less time debugging.
*   **Easy:** Designed to be easy to use and learn. Great documentation.
*   **Short:** Minimizes code duplication. Each parameter declaration defines validation, serialization, and documentation.
*   **Robust:** Get production-ready code with automatic interactive documentation.
*   **Standards-based:** Based on and fully compatible with open standards for APIs: OpenAPI (formerly Swagger) and JSON Schema.
*   **Asynchronous Support:** Natively supports `async`/`await` syntax for asynchronous operations, making it ideal for I/O-bound tasks.
*   **Dependency Injection:** Built-in, easy-to-use dependency injection system simplifies managing dependencies and testing.
*   **Automatic Docs:** Interactive API documentation (Swagger UI and ReDoc) generated automatically from your code and type hints.

## 🛠️ Installation / Setup

*   **Prerequisites:** Python installed (see [../foundational/Python.md](../foundational/Python.md)), preferably managed with `uv` or `venv`.
*   **Install FastAPI and a Server:** FastAPI requires an ASGI server like Uvicorn or Hypercorn to run.
    ```bash
    # Using pip (within an activated venv)
    pip install fastapi "uvicorn[standard]"

    # Using uv (recommended)
    uv add fastapi "uvicorn[standard]" 
    ```
    *   `fastapi`: The core framework.
    *   `uvicorn[standard]`: The ASGI server, with optional extras for better performance.

## 💡 Getting Started

### 1. Create a Simple API (`main.py`)

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional # Optional is used for optional query parameters or request body fields

# Create a FastAPI instance
app = FastAPI()

# Define a Pydantic model for request body validation (optional)
class Item(BaseModel):
    name: str
    description: Optional[str] = None # Optional field with default value None
    price: float
    tax: Optional[float] = None

# Define a simple GET endpoint at the root path "/"
@app.get("/")
async def read_root():
    return {"message": "Hello World"}

# Define a GET endpoint with a path parameter
@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Optional[str] = None): 
    # item_id is a path parameter (type-hinted as int)
    # q is an optional query parameter (type-hinted as Optional[str])
    response = {"item_id": item_id}
    if q:
        response.update({"q": q})
    return response

# Define a POST endpoint that uses the Pydantic model for the request body
@app.post("/items/")
async def create_item(item: Item):
    # The request body is automatically validated against the Item model
    print(f"Received item: {item.name}")
    item_dict = item.dict() # Convert Pydantic model to dict
    if item.tax:
        price_with_tax = item.price + item.tax
        item_dict.update({"price_with_tax": price_with_tax})
    return item_dict

# Define a PUT endpoint to update an item
@app.put("/items/{item_id}")
async def update_item(item_id: int, item: Item):
    return {"item_id": item_id, **item.dict()} 
```

### 2. Run the API with Uvicorn

*   From your terminal, in the same directory as `main.py`:
    ```bash
    uvicorn main:app --reload
    ```
    *   `main`: The file `main.py`.
    *   `app`: The object created inside `main.py` with `app = FastAPI()`.
    *   `--reload`: Makes the server restart automatically after code changes. Only use for development.

### 3. Interact with the API

*   Open your browser to `http://127.0.0.1:8000`. You should see `{"message":"Hello World"}`.
*   Go to `http://127.0.0.1:8000/items/5?q=somequery`. You should see `{"item_id":5,"q":"somequery"}`.
*   Go to `http://127.0.0.1:8000/docs`. You'll see the automatic interactive **Swagger UI** documentation. You can test your POST and PUT endpoints directly from here.
*   Go to `http://127.0.0.1:8000/redoc`. You'll see the alternative **ReDoc** documentation.

## 📚 Help & Resources

*   **Official FastAPI Documentation:** Excellent, comprehensive, and full of examples. [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
*   **FastAPI GitHub Repository:** [https://github.com/tiangolo/fastapi](https://github.com/tiangolo/fastapi)
*   **Pydantic Documentation:** Essential for understanding data validation. [https://pydantic-docs.helpmanual.io/](https://pydantic-docs.helpmanual.io/)
*   **Starlette Documentation:** Useful for understanding the underlying ASGI framework. [https://www.starlette.io/](https://www.starlette.io/)
*   **TestDriven.io FastAPI Course:** [https://testdriven.io/courses/fastapi-crud/](https://testdriven.io/courses/fastapi-crud/) (Example, many others exist)
*   **Stack Overflow:** [https://stackoverflow.com/questions/tagged/fastapi](https://stackoverflow.com/questions/tagged/fastapi)

## ✅ Next Steps

*   Explore path parameters, query parameters, and request bodies in more detail.
*   Learn about Dependency Injection for managing database connections, authentication, etc.
*   Integrate with databases using ORMs like SQLAlchemy or SQLModel.
*   Implement authentication and authorization (e.g., OAuth2 with JWT).
*   Structure larger applications using `APIRouter`.
*   Write unit and integration tests using `pytest` and `TestClient`.

---
*Licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)*
*Visit [ProductFoundry.ai](https://productfoundry.ai)*