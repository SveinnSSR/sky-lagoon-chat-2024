import { MongoClient } from "mongodb";
 
// Your Atlas connection string
const uri = "mongodb+srv://sveinn:JIm5xi4Ou32e7nEF@cluster0.mbibs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
                      
async function run() {
    try {
        // Connect to the Atlas cluster
        await client.connect();
        // Get the database and collection
        const db = client.db("gettingStarted");
        const col = db.collection("people");
        
        // Create documents                                                                                                                                         
        const peopleDocuments = [
          {
            "name": { "first": "Alan", "last": "Turing" },
            "birth": new Date(1912, 5, 23), // May 23, 1912                                                                                                                                 
            "death": new Date(1954, 5, 7),  // May 7, 1954                                                                                                                                  
            "contribs": [ "Turing machine", "Turing test", "Turingery" ],
            "views": 1250000
          },
          {
            "name": { "first": "Grace", "last": "Hopper" },
            "birth": new Date(1906, 11, 9), // Dec 9, 1906                                                                                                                                 
            "death": new Date(1992, 0, 1),  // Jan 1, 1992                                                                                                                                  
            "contribs": [ "Mark I", "UNIVAC", "COBOL" ],
            "views": 3860000
          }
        ];
        
        // Insert the documents into the collection        
        const p = await col.insertMany(peopleDocuments);
        console.log(`${p.insertedCount} documents were inserted`);
        
        // Find a document
        const filter = { "name.last": "Turing" };
        const document = await col.findOne(filter);
        
        // Print results
        console.log("Document found:\n" + JSON.stringify(document));
    } catch (err) {
        console.log(err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
