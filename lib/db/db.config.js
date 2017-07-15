import mongoose from 'mongoose';
import blueBird from 'bluebird';

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance';

mongoose.Promise = blueBird;

mongoose.connect(dbURI, {
  useMongoClient: true,
});

mongoose.connection.on('error', function(error) {
  console.log('MONGODB CONNECTION ERROR ----> ', error);
});

mongoose.connection.on('open', function() {
  console.log('MONODB CONNECTED')
});

export default mongoose;