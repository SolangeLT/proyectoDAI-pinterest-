# Imitacion de Pinterest

Aplicacion web full-stack para publicar, editar, reemplazar, eliminar y descubrir imagenes en un mosaico responsivo inspirado en Pinterest. El proyecto usa React con Vite en el frontend, FastAPI en el backend, PostgreSQL como base de datos obligatoria y Unsplash como API externa consumida desde la API propia para las imagenes aleatorias de la pagina.

## Resumen del producto

Mosaico permite dar de alta usuarios con nombre y correo. Cada usuario puede guardar imagenes por URL con fecha de alta y etiquetas. El feed muestra los posts en formato de mosaico, permite consultar el detalle por id, y protege la edicion/eliminacion con el header `X-User`, que contiene el `id` del usuario guardado en `sessionStorage`.

Tambien incluye un apartado de descubrimiento que llama a Unsplash desde el backend y transforma la respuesta para regresar solo los datos necesarios para renderizar la foto.

## Tecnologias

- Frontend: React, Vite, Bootstrap 5.3, React Router, TanStack Query.
- Backend: FastAPI, Pydantic, SQL directo con `psycopg`.
- Base de datos: PostgreSQL.
- API externa: Unsplash.

## Modelo relacional

`users`

- `id UUID PRIMARY KEY`
- `username TEXT NOT NULL UNIQUE`
- `email TEXT NOT NULL UNIQUE`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

`posts`

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `image_url TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

`tags`

- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL UNIQUE`

`post_tags`

- `post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE`
- `tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE`
- `PRIMARY KEY (post_id, tag_id)`

La relacion `users` a `posts` es uno-a-muchos: un usuario puede crear muchos posts. La tabla `post_tags` permite una relacion muchos-a-muchos: un post puede tener muchas etiquetas y una etiqueta puede estar en muchos posts.

## Levantar el backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edita `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mosaico
UNSPLASH_ACCESS_KEY=tu_access_key_de_unsplash
FRONTEND_URL=http://localhost:5173
```

Inicia el servidor:

```bash
fastapi dev main.py --port 8080
```

Health endpoint local:

```text
http://127.0.0.1:8080/health
```

## Levantar el frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Edita `frontend/.env` si tu backend usa otro host:

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
```

Cliente local:

```text
http://localhost:5173
```

## Endpoints principales

- `GET /health`: revisa API, PostgreSQL y Unsplash.
- `GET /users`: lista usuarios.
- `POST /users`: crea usuario con `username` y `email`.
- `GET /posts?page=&limit=&min_date=`: lista paginada.
- `GET /posts/{id}`: obtiene un post por id.
- `POST /posts`: crea post.
- `PATCH /posts/{id}`: edita campos parciales.
- `PUT /posts/{id}`: reemplaza el post completo.
- `DELETE /posts/{id}`: elimina el post.
- `GET /discover?count=`: llama Unsplash desde backend y transforma la respuesta.

Las llamadas `POST /posts`, `PATCH /posts/{id}`, `PUT /posts/{id}` y `DELETE /posts/{id}` necesitan el header `X-User`. En el frontend se obtiene del usuario guardado en `sessionStorage` y corresponde a `users.id`.

## Despliegue

Sugerencia para Render:

- Crear una base PostgreSQL.
- Crear un Web Service para `backend/`.
- Crear un Static Site para `frontend/`.
- Configurar `DATABASE_URL`, `UNSPLASH_ACCESS_KEY`, `FRONTEND_URL` y `VITE_API_BASE_URL`.

Enlaces de entrega:

- Cliente desplegado: pendiente.
- Health endpoint desplegado: pendiente.

## Autores

- Nombre 1
- Nombre 2
- Nombre 3
- Nombre 4

## Pruebas sugeridas

- Crear usuario en la barra superior con nombre y correo.
- Seleccionar ese usuario y crear un post.
- Ver el detalle en `/posts/:id`.
- Editar con `PATCH` y reemplazar con `PUT`.
- Eliminar con el usuario creador.
- Intentar editar/eliminar con otro usuario y confirmar respuesta `403`.
- Probar paginacion del feed.
- Revisar que el feed guarde cache y timestamp en `localStorage`.
- Entrar a `/discover` y confirmar que las fotos vienen de Unsplash via backend.
- Verificar OpenGraph con el URL desplegado.
