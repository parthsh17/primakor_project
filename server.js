const http = require("http");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "primakor",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database.");
});

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "GET" && req.url.startsWith("/api/node/")) {
    const nodeId = req.url.split("/").pop();

    db.query(
      `SELECT * FROM nodes WHERE node_id = ?`,
      [nodeId],
      (err, nodeResults) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Database query failed" }));
          return;
        }

        if (nodeResults.length === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Node not found" }));
          return;
        }

        const node = nodeResults[0];

        if (node.action_id) {
          db.query(
            `SELECT * FROM actions WHERE action_id = ?`,
            [node.action_id],
            (err, actionResults) => {
              if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Database query failed" }));
                return;
              }

              const action = actionResults[0] || null;

              db.query(
                `SELECT * FROM options WHERE node_id = ?`,
                [nodeId],
                (err, optionsResults) => {
                  if (err) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Database query failed" }));
                    return;
                  }

                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      node,
                      options: optionsResults,
                      action,
                    })
                  );
                }
              );
            }
          );
        } else {
          db.query(
            `SELECT * FROM options WHERE node_id = ?`,
            [nodeId],
            (err, optionsResults) => {
              if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Database query failed" }));
                return;
              }

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  node,
                  options: optionsResults,
                  action: null,
                })
              );
            }
          );
        }
      }
    );
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
