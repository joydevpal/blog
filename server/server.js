
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config/config')

const mongoose = require('./db/mongoose');
const { Post } = require('./models/post');
const { User } = require('./models/user');
const { requireAdmin } = require('./middleware/requireAdmin');
const { requireAuthAsync } = require('./middleware/requireAuth');


const app = express();
const router = express.Router();
const port = process.env.PORT || 4000;

const corsOptions = {
  exposedHeaders: 'x-auth'
};

router.use(cors(corsOptions));
//Body Parser
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json());


router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).send({ posts });
  } catch (e) {
    res.status(400).send();
  }
});

router.post('/posts', requireAdmin, async (req, res) => {
  try {
    const body = _.pick(req.body, ['title', 'category', 'body', 'mainImage', 'thumbnail']);
    const post = new Post({
      title: body.title,
      category: body.category,
      author: req.user.displayName,
      body: body.body,
      mainImage: body.mainImage || '',
      thumbnail: body.thumbnail || ''
    });

    await post.save();
    res.status(200).send({ post });
  } catch (e) {
    res.status(400).send({ error: 'Please check post field requirements' });
  }
});

router.patch('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const body = _.pick(req.body, ['title', 'category', 'body', 'mainImage', 'thumbnail']);

    const post = await Post.findOneAndUpdate(id, { $set: body }, { new: true });
    res.status(200).send({ post });
  } catch (e) {
    res.status(400).send({ error: 'Could not update post.' });
  }
});

router.delete('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) {
      return res.status(400).send();
    }

    const post = await Post.findByIdAndRemove(id);

    if (!post) {
      return res.status(400).send({ error: 'Could not delete post.' });
    }

    res.status(200).send();
  } catch (e) {
    res.status(400).send();
  }

});

router.post('/posts/:id/comments', requireAuthAsync, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) {
      throw new Error();
    }

    const body = _.pick(req.body, ['comment']);
    body.createdBy = req.user.displayName;

    const post = await Post.findByIdAndUpdate(id, { $push: { comments: body } }, { new: true });
    const comment = _.last(post.comments)
    res.status(200).send(comment);
  } catch (e) {
    res.status(400).send({ error: 'Unable to post comment.' });
  }
});

router.post('/users', async (req, res) => {  
  try {
    const useremail = await User.findOne({email:req.body.emal})    
    if(useremail){
      res.status(401).send({ errors: 'The email has already use' })
    } else{    
    const user = new User({
      email:req.body.email,
      displayName:req.body.displayName,
      password: bcryptjs.hashSync(req.body.password,8)
    });
   const saveuser =  await user.save();
    const token = jwt.sign({id:saveuser._id},config.secret,{expiresIn:3600})
    res.header('x-auth', token).send(saveuser);
  }
  } catch (e) {
    res.status(400).send({ errors: 'Oops something went wrong,Please tray again later' });
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findOne({email:req.body.email})
    if(user){
      const validpassword = await bcryptjs.compareSync(req.body.password,user.password)
      if(validpassword){
        const token = jwt.sign({id:user._id,role:user.role},config.secret,{expiresIn:3600})
        res.header('x-auth', token).send(user);
      }else{
        res.status(401).send({ error: 'The password you entered is incorrect. Please try again.' });
      }
    }else{
      res.status(401).send({ error: 'The email  you entered is incorrect. Please try again.' });
    }    
  } catch (e) {
    res.status(401).send({ error: 'The email or password you entered is incorrect. Please try again.' });
  }
});

router.delete('/users/me/token', requireAuthAsync, async (req, res) => {
  try {
    await req.user.removeToken(req.token);
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e);
  }
});

app.use('/api', router);

app.listen(port, () => {
  console.log(`Server is up on port ${port}`)
});

module.exports = { app };