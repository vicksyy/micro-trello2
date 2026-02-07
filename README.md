# Micro Trello

Tablero Kanban ligero para crear, editar, mover y evaluar tareas de forma visual.

## Objetivo

El objetivo de este proyecto es ofrecer una herramienta simple y rápida para organizar tareas en columnas (`To Do`, `Doing`, `Done`), con soporte para:

- Prioridades y etiquetas
- Fecha límite
- Ordenación visual por arrastre (drag & drop)
- Registro de auditoría de cambios
- `Modo Dios` para notas y observaciones de evaluación

## Demo

Aplicación desplegada en Vercel:

- https://micro-trello.vercel.app/

## Cómo usar

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar en local

```bash
npm run dev
```

Abre en el navegador:

- http://localhost:3000

### 3. Build de producción

```bash
npm run build
npm start
```

## Capturas

### 1. Vista general del tablero

![Captura 1 - Tablero](./public/Captura_tablero.png)

### 2. Auditoría

![Captura 2 - Auditoría](./public/Captura_auditoria.png)

### 3. Crear tarea

![Captura 3 - Crear tarea](./public/Captura_tarea.png)

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- dnd-kit

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # build producción
npm start        # ejecutar build
npm run lint     # lint
```
