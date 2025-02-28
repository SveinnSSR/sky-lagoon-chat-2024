// ES Module syntax
import { MongoClient } from 'mongodb';

// Replace with your Atlas connection string
const url = "mongodb+srv://sveinn:JIm5xi4Ou32e7nEF@cluster0.mbibs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to your Atlas cluster
const client = new MongoClient(url);

async function run() {
    try {
        await client.connect();
        console.log("Successfully connected to Atlas");
    } catch (err) {
        console.log(err.stack);
    }
    finally {
        await client.close();
    }
}

run().catch(console.dir);
