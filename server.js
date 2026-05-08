const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

/* ===== DB ===== */
const db = new sqlite3.Database(path.join(__dirname, "database.db"));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      category TEXT,
      region TEXT,
      description TEXT
    )
  `);
});

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ===== USERS ===== */
let users = [
  { email: "admin@test.com", password: "123", role: "admin", fullName: "Admin" },
  { email: "inv@test.com", password: "123", role: "investor", fullName: "Investor" },
  { email: "gov@test.com", password: "123", role: "government", fullName: "Government" },
  { email: "comp@test.com", password: "123", role: "company", fullName: "Company" },
  { email: "men@test.com", password: "123", role: "mentor", fullName: "Mentor" }
];

/* ===== HOME ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===== LOGIN ===== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  let redirect = "/employee.html";

  if (user.role === "admin") redirect = "/admin.html";
  else if (user.role === "investor") redirect = "/investor.html";
  else if (user.role === "government") redirect = "/government.html";
  else if (user.role === "company") redirect = "/company.html";
  else if (user.role === "mentor") redirect = "/mentor.html";

  res.json({
    success: true,
    redirect,
    user
  });
});

/* ===== REGISTER ===== */
app.post("/register", (req, res) => {
  const { email, password, fullName } = req.body;

  const exists = users.some(u => u.email === email);

  if (exists) {
    return res.status(409).json({
      success: false,
      message: "Email already exists"
    });
  }

  const newUser = {
    email,
    password,
    role: "employee",
    fullName
  };

  users.push(newUser);

  res.json({
    success: true,
    redirect: "/employee.html",
    user: newUser
  });
});

/* ===== CONTACT ===== */
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  db.run(
    `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`,
    [name, email, message],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});

/* ===== PROBLEMS ===== */
app.post("/problems", (req, res) => {
  const { title, category, region, description } = req.body;

  db.run(
    `INSERT INTO problems (title, category, region, description) VALUES (?, ?, ?, ?)`,
    [title, category, region, description],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});

/* ===== GET DATA ===== */
app.get("/users", (req, res) => {
  res.json(users);
});

app.get("/contacts", (req, res) => {
  db.all("SELECT * FROM contacts", [], (err, rows) => {
    if (err) return res.send(err.message);
    res.json(rows);
  });
});

app.get("/problems", (req, res) => {
  db.all("SELECT * FROM problems", [], (err, rows) => {
    if (err) return res.send(err.message);
    res.json(rows);
  });
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});