
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

const server = http.createServer(async (req, res) => {
  // Mostra la pagina principale
  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(__dirname, "index.html");

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8"
        });
        return res.end("Errore nel caricamento della pagina.");
      }

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      res.end(content);
    });

    return;
  }

  // Gestisce le richieste alla chat
  if (req.method === "POST" && req.url === "/chat") {
    if (!API_KEY) {
      res.writeHead(500, {
        "Content-Type": "application/json"
      });
      return res.end(JSON.stringify({
        error: "Chiave API non configurata su Render."
      }));
    }

    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 100000) {
        req.destroy();
      }
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        if (!data.message || typeof data.message !== "string") {
          throw new Error("Messaggio non valido.");
        }

        const response = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4.1-mini",
              instructions:
                "Sei IBRA AI, un assistente personale intelligente. " +
                "Rispondi in italiano, in modo chiaro, utile e semplice. " +
                "Aiuta con scuola, programmazione, creatività e progetti.",
              input: data.message
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error("Errore OpenAI:", result);

          res.writeHead(response.status, {
            "Content-Type": "application/json"
          });

          return res.end(JSON.stringify({
            error: "Errore durante la richiesta all'intelligenza artificiale."
          }));
        }

        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
          reply: result.output_text || "Non ho ricevuto una risposta."
        }));

      } catch (error) {
        console.error("Errore chat:", error);

        res.writeHead(400, {
          "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
          error: "Non è stato possibile elaborare il messaggio."
        }));
      }
    });

    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Pagina non trovata.");
});

server.listen(PORT, () => {
  console.log(`IBRA AI attivo sulla porta ${PORT}`);
});
