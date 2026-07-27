# Revision Tesis (AI-Powered Thesis Review System)

Este repositorio contiene un sistema monorepo para la revisión inteligente y evaluación asistida por Inteligencia Artificial (IA) de tesis y proyectos de investigación académica. El sistema analiza el formato, estructura y coherencia interna de los documentos apoyándose en modelos de lenguaje avanzados.

## Repositorio Oficial
El repositorio del proyecto se encuentra en:
[https://github.com/Jason222334/revision-tesis-app](https://github.com/Jason222334/revision-tesis-app)

---

## 🔑 Credenciales de Administrador por Defecto

Al inicializar y sembrar la base de datos, se creará un usuario administrador por defecto con las siguientes credenciales para acceder al sistema:

- **Correo Electrónico:** `admin@universidad.edu`
- **Contraseña:** `admin123`
- **Rol:** `ADMIN`

---

## 🛠️ Arquitectura y Tecnologías

El proyecto se gestiona como un monorepo utilizando **TurboRepo** y **pnpm**.

### Componentes Principales
*   **`apps/api` (Backend):** Desarrollado con NestJS. Ofrece APIs REST, tareas en segundo plano a través de BullMQ y procesamiento de IA multimodal con LangChain, Gemini SDK y OpenAI API.
*   **`apps/web` (Frontend):** Desarrollado con Next.js 15+ (App Router) y React 19. Cuenta con diseño responsivo usando Tailwind CSS 4, Shadcn UI y gestión de autenticación con NextAuth.js v5.
*   **`packages/database` (Base de Datos):** Cliente y esquemas de Prisma utilizando PostgreSQL con la extensión `pgvector` para búsquedas de similitud semántica.
*   **`packages/types` (Tipos Compartidos):** Definiciones TypeScript reutilizadas a lo largo de todo el monorepo.

---

## 🚀 Guía de Instalación y Desarrollo Local

### Requisitos Previos
Asegúrate de tener instalados los siguientes componentes en tu sistema:
- Node.js >= 20.0.0
- pnpm 9+
- Docker & Docker Compose

### Pasos para Levantar el Proyecto

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Jason222334/revision-tesis-app.git
    cd revision-tesis-app
    ```

2.  **Instalar las dependencias:**
    ```bash
    pnpm install
    ```

3.  **Iniciar servicios de infraestructura (Base de datos, Redis y Almacenamiento):**
    ```bash
    docker-compose up -d
    ```
    *Esto levantará:*
    - **PostgreSQL (con pgvector):** Puerto `5433` (ver `docker-compose.yml`).
    - **Redis:** Para la gestión de colas de BullMQ (puerto `6379`).
    - **MinIO:** Almacenamiento local compatible con S3 para documentos cargados (puertos `9000` y `9001`).

4.  **Configurar variables de entorno:**
    - Revisa y crea los archivos `.env` en la raíz del proyecto, en `apps/api` y en `packages/database` (puedes guiarte de posibles `.env.example`).
    - Asegúrate de que `DATABASE_URL` apunte al puerto `5433`.

5.  **Inicializar la Base de Datos y Sembrar los Datos Iniciales:**
    ```bash
    cd packages/database
    npx prisma migrate dev
    npx prisma db seed
    ```
    *Este último comando creará las credenciales de administrador y el programa académico base.*

6.  **Iniciar el entorno de desarrollo:**
    Regresa a la raíz del repositorio y ejecuta:
    ```bash
    pnpm dev
    ```
    El portal frontend estará disponible en [http://localhost:3000](http://localhost:3000) y la API en [http://localhost:3001](http://localhost:3001).

---

## 📋 Comandos de Desarrollo

Desde la raíz del proyecto:
- `pnpm dev`: Inicia todos los servicios del monorepo en modo desarrollo.
- `pnpm build`: Compila todas las aplicaciones y paquetes.
- `pnpm lint`: Ejecuta el análisis estático de código en todo el monorepo.
- `pnpm format`: Da formato al código usando Prettier.

### Backend (`apps/api`)
- `pnpm test`: Ejecuta las pruebas unitarias.
- `pnpm test:e2e`: Ejecuta las pruebas de extremo a extremo (E2E).
