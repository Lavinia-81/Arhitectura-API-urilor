Ex2. Adaugă Cloudflare pentru domeniul tău

-----

Pași recomandați

1️. Adaugi domeniul în Cloudflare -> ```https://dash.cloudflare.com```

-----

2️. Activezi WAF -> Security -> WAF -> ON
Activezi regulile standard (OWASP Core Ruleset)

-----

3️. Activezi rate limiting -> Security -> Rate Limiting
Creezi o regulă:
Path: /works/*
Limit: 100 requests / minute
Action: Block sau Challenge

-----

4️. Creezi un CNAME către Render
Exemplu:
```poezii.api.com -> yourapp.onrender.com```

-----

5️. Accesezi API-ul prin domeniul tău
```curl https://poezii-api.com/health```

Dacă răspunde -> API-ul tău este protejat enterprise.