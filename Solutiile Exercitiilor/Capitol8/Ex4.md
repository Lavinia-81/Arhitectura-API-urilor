Ex4. WAF rule — Cloudflare JS Challenge pe /v1/fulltext

-----

Regulă conceptuală (în Cloudflare):
Expression (Firewall rule):
```
(http.request.uri.path eq "/v1/fulltext")
and
(cf.threat_score lt 10)
and
(http.request.rate > 20)
``
-----

=> Action: JS Challenge

În UI:

-> Security → WAF -> Firewall Rules -> Create rule
-> Path: /v1/fulltext
-> Threshold: >20 req/sec/IP
-> Action: JS Challenge

Rezultat: scraping agresiv pe fulltext -> lovit de challenge.