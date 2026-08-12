Ex4. Scrie un Dockerfile și rulează API-ul în container 

-----

Dockerfile minimal, profesionist
```
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```
-----


Construiești imaginea
```docker build -t poezii-api```

-----


Rulezi containerul
```docker run -p 3000:3000 poezii-api```

-----

Test
```curl http://localhost:3000/health```

-----

Dacă funcționează → containerizarea este corectă.