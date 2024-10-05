const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const groupRoutes = require('./routes/groups'); 
const postRoutes = require('./routes/posts'); 
const commentRoutes = require('./routes/comment'); 
const imageRoutes = require('./routes/image'); 

const app = express();

app.use(cors());
app.use(bodyParser.json()); 

mongoose.connect('mongodb://localhost/mygroupdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB에 연결되었습니다.');
}).catch((err) => {
  console.error('MongoDB 연결 오류:', err);
});

app.use('/api/groups', groupRoutes); 
app.use('/api', postRoutes); 
app.use('/api', commentRoutes); 
app.use('/api', imageRoutes); 
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
