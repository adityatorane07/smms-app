const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const app = express();

// MongoDB Atlas connection string
const mongoURI = "mongodb+srv://atorane328:hICkwQ1EdrMwnLrD@aditya.x6yc3.mongodb.net/?retryWrites=true&w=majority&appName=aditya";

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.log('MongoDB connection error:', err));

// Define a schema for student data
const studentSchema = new mongoose.Schema({
  rno: Number,       
  name: String,
  marks: Number,
  image: String,     
});

const Student = mongoose.model('Student', studentSchema);

// Middleware for CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// **POST** route to save student data
app.post("/ss", upload.single("file"), (req, res) => {
  const { rno, name, marks } = req.body;
  if (!rno || !name || !marks || !req.file) {
    return res.status(400).send({ error: "All fields are required." });
  }

  const newStudent = new Student({
    rno: rno,
    name: name,
    marks: marks,
    image: req.file.filename, 
  });

  newStudent.save()
    .then((result) => res.send({ message: "Record created successfully", result }))
    .catch((err) => {
      console.error("Database Error:", err);
      res.status(500).send({ error: "Database Error", details: err });
    });
});

// **GET** route to fetch all student data
app.get("/gs", (req, res) => {
  Student.find()
    .then((students) => {
      res.json(students); 
    })
    .catch((err) => {
      console.error("Error fetching students:", err);
      res.status(500).send({ error: "Failed to fetch student data", details: err });
    });
});

// **DELETE** route to delete a student by ID
app.delete("/delete/:id", (req, res) => {
  const studentId = req.params.id;

  Student.findByIdAndDelete(studentId)
    .then((result) => {
      if (!result) {
        return res.status(404).send({ error: "Student not found" });
      }
      
      // If the student has an associated image, delete the image from the 'uploads' folder
      if (result.image) {
        const imagePath = path.join(__dirname, 'uploads', result.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.send({ message: "Record deleted successfully", result });
    })
    .catch((err) => {
      console.error("Error deleting record:", err);
      res.status(500).send({ error: "Failed to delete student", details: err });
    });
});

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
