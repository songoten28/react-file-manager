const express = require("express");
const connectDB = require("./app/config/db.config");
const cors = require("cors");
const fileSystemRoutes = require("./app/routes/fileSystem.routes");
const errorHandler = require("./app/middlewares/errorHandler.middleware");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const folderPath = require("./app/config/folder.config");
const startScan = require("./app/config/scanfolder");

dotenv.config();

const app = express();
// Database connection
connectDB().then(()=> {
  startScan(folderPath)
});

// CORS setup
app.use(cors({ origin: process.env.CLIENT_URI }));
// Static files serving
app.use(express.static(folderPath));

// Middlewares to parse URL-encoded body & JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/api/file-system", fileSystemRoutes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handling middleware
app.use(errorHandler);

//loading folder

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
