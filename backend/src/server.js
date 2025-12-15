import app from "./app.js";

const PORT = ProcessingInstruction.env.PORT || 4000;

app.listen(PORT, ()=>{console.log(`BACKEND running on port ${PORT}`);
});