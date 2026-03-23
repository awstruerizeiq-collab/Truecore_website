# -------------------------------
# Stage 1: Build React (Vite) app
# -------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# --- ADD THESE TWO LINES ---
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# ---------------------------

COPY package*.json ./
RUN npm install
COPY . .
RUN npm install  # Ensure dependencies are fresh
RUN npm run build

# -------------------------------
# Stage 2: Run production server
# -------------------------------
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]