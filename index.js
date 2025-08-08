const express =require ('express');
const mongoose =require ('mongoose')
require('dotenv').config();
const router = require('./src/routes/allRoutes')
const app = express();
const cors = require("cors");
const port = process.env.PORT || 7777;
const logger = require("./src/helper/logger"); 
const path = require("path");
const morgan = require("morgan")

mongoose.connect(process.env.DBURL, {
    maxPoolSize: 10,
    serverselectiontimeoutMS: 3000
})
.then(() => logger.info("🚀 Successfully Connected to MongoDB"))
.catch(err => logger.error(`MongoDB Connection Error: ${err.message}`));


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

app.use(router);
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));


app.get('/', (req, res) => {
    res.send(' ***🔥🔥 Hey ramya.. You server is running 🔥🔥*** ')
  })

app.listen(port, ()=>{
    logger.info(`🚀 Server is running on port ${port}`);
});

