# Imitacion de Pinterest

Este proyecto es una aplicacion web full-stack hecha para una materia de la universidad. La idea fue crear una pagina inspirada en Pinterest, donde se puedan publicar imagenes, verlas en un mosaico, editar posts, eliminarlos y descubrir imagenes externas.

El proyecto usa React con Vite en el frontend, FastAPI en el backend, PostgreSQL como base de datos y Unsplash como API externa consumida desde mi propia API. Tambien agregue carga de imagenes desde archivo para que no dependa solamente de pegar links.

## Resumen del producto

Mosaico permite dar de alta usuarios con nombre y correo desde la pestana **Agregar usuario**. Cada usuario puede crear posts con una imagen subida desde su computadora o con un link directo a una imagen. Los posts tambien pueden tener fecha de alta y etiquetas.

El feed muestra los posts en formato de mosaico, permite consultar el detalle por id y protege la edicion/eliminacion con el header `X-User`, que contiene el `id` del usuario guardado en `sessionStorage`.

Tambien se puede cambiar de usuario desde el selector de la barra superior. El boton **Sign out** cierra la cuenta activa en esa sesion y la quita del selector, pero no elimina el usuario de la base de datos.

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
  Puede ser un link directo o una URL generada por FastAPI cuando se sube un archivo.
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

Al abrir la API local se muestra Swagger para poder probar los endpoints:

```text
http://127.0.0.1:8080
```

La ruta anterior redirige a:

```text
http://127.0.0.1:8080/docs
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

Si se usa otra direccion para el backend, hay que cambiar `VITE_API_BASE_URL`.

## Endpoints principales

- `GET /health`: revisa API, PostgreSQL y Unsplash.
- `GET /users`: lista usuarios.
- `POST /users`: crea usuario con `username` y `email`.
- `POST /uploads`: sube una imagen local y regresa una URL para usarla en un post.
- `GET /posts?page=&limit=&min_date=`: lista paginada.
- `GET /posts/{id}`: obtiene un post por id.
- `POST /posts`: crea post.
- `PATCH /posts/{id}`: edita campos parciales.
- `PUT /posts/{id}`: reemplaza el post completo.
- `DELETE /posts/{id}`: elimina el post.
- `GET /discover?count=`: llama Unsplash desde backend y transforma la respuesta.

Las llamadas `POST /posts`, `PATCH /posts/{id}`, `PUT /posts/{id}` y `DELETE /posts/{id}` necesitan el header `X-User`. En el frontend se obtiene del usuario guardado en `sessionStorage` y corresponde a `users.id`.

El endpoint `POST /uploads` recibe un archivo en formato multipart con el campo `file`. Acepta imagenes `jpg`, `png`, `webp` y `gif`. Las imagenes se guardan localmente en:

```text
backend/uploads/
```

Esa carpeta esta en `.gitignore` porque son archivos subidos por el usuario y no deben subirse al repositorio.

## Uso basico de la pagina

1. Entrar a **Agregar usuario** y crear un usuario con nombre y correo.
2. Seleccionar el usuario activo.
3. Entrar a **Nuevo** para crear un post.
4. Subir una imagen desde archivo o pegar un link directo a una imagen.
5. Agregar etiquetas separadas por coma.
6. Guardar el post y verlo en el feed.
7. Desde el detalle del post se puede editar, reemplazar o eliminar si el usuario activo es el creador.
8. Si se quiere cerrar la cuenta activa, usar **Sign out**.

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

- Crear usuario desde la pestana Agregar usuario.
- Seleccionar ese usuario y crear un post.
- Crear un post subiendo una imagen local.
- Crear un post usando un link directo a imagen.
- Ver el detalle en `/posts/:id`.
- Editar con `PATCH` y reemplazar con `PUT`.
- Eliminar con el usuario creador.
- Intentar editar/eliminar con otro usuario y confirmar respuesta `403`.
- Probar paginacion del feed.
- Revisar que el feed guarde cache y timestamp en `localStorage`.
- Entrar a `/discover` y confirmar que las fotos vienen de Unsplash via backend.
- Entrar a `http://127.0.0.1:8080` y confirmar que abre la documentacion Swagger.
- Verificar OpenGraph con el URL desplegado.
