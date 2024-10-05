const express = require('express');
const router = express.Router();
const Post = require('../models/post'); 
const mongoose = require('mongoose'); 

router.post('/groups/:groupId/posts', async (req, res) => {
    const { groupId } = req.params;
    const {
      nickname, title, content, postPassword, groupPassword, imageUrl, tags, location, moment, isPublic
    } = req.body;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ message: '유효하지 않은 그룹 ID입니다.' });
      }

      const objectIdGroupId = new mongoose.Types.ObjectId(groupId);
  
      const newPost = new Post({
        groupId: objectIdGroupId,  
        nickname,
        title,
        content,
        postPassword,
        groupPassword,
        imageUrl,
        tags,
        location,
        moment,
        isPublic,
        likeCount: 0,
        commentCount: 0
      });
  
      const savedPost = await newPost.save();
      res.status(201).json({
        id: savedPost._id,
        groupId: savedPost.groupId,
        nickname: savedPost.nickname,
        title: savedPost.title,
        content: savedPost.content,
        imageUrl: savedPost.imageUrl,
        tags: savedPost.tags,
        location: savedPost.location,
        moment: savedPost.moment,
        isPublic: savedPost.isPublic,
        likeCount: savedPost.likeCount,
        commentCount: savedPost.commentCount,
        createdAt: savedPost.createdAt
      });
    } catch (error) {
      console.error('게시글 등록 실패:', error);
      res.status(500).json({ message: '게시글 등록 중 오류가 발생했습니다.', error: error.message });
    }
});

// 게시글 조회 (GET)
router.get('/groups/:groupId/posts', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic } = req.query;
  const { groupId } = req.params;

  try {
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(pageSize, 10);

    let sortOption;
    switch (sortBy) {
      case 'mostCommented':
        sortOption = { commentCount: -1 };
        break;
      case 'mostLiked':
        sortOption = { likeCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const filter = {
      groupId,
      ...(isPublic !== undefined ? { isPublic } : {}),
      ...(keyword ? { $or: [{ title: new RegExp(keyword, 'i') }, { content: new RegExp(keyword, 'i') }] } : {})
    };

    const totalPosts = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort(sortOption)
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit);

    res.status(200).json({
      currentPage: pageNumber,
      totalPages: Math.ceil(totalPosts / pageLimit),
      totalItemCount: totalPosts,
      data: posts
    });
  } catch (error) {
    console.error('게시글 조회 실패:', error);
    res.status(500).json({ message: '게시글 조회 중 오류가 발생했습니다.' });
  }
});

// 게시글 수정 (PUT)
router.put('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  const { nickname, title, content, postPassword, imageUrl, tags, location, moment, isPublic } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    post.nickname = nickname || post.nickname;
    post.title = title || post.title;
    post.content = content || post.content;
    post.postPassword = postPassword || post.postPassword;
    post.imageUrl = imageUrl || post.imageUrl;
    post.tags = tags || post.tags;
    post.location = location || post.location;
    post.moment = moment || post.moment;
    post.isPublic = isPublic !== undefined ? isPublic : post.isPublic;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('게시글 수정 실패:', error);
    res.status(500).json({ message: '게시글 수정 중 오류가 발생했습니다.' });
  }
});

// 게시글 삭제 (DELETE)
router.delete('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  const { postPassword } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (post.postPassword !== postPassword) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    await post.deleteOne();
    res.status(200).json({ message: '게시글 삭제 성공' });
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    res.status(500).json({ message: '게시글 삭제 중 오류가 발생했습니다.' });
  }
});

// 게시글 상세 정보 조회 (GET)
router.get('/posts/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('게시글 상세 조회 실패:', error);
    res.status(500).json({ message: '게시글 조회 중 오류가 발생했습니다.' });
  }
});

// 게시글 조회 권한 확인 (POST)
router.post('/posts/:postId/verify-password', async (req, res) => {
  const { postId } = req.params;
  const { password } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (post.postPassword !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    res.status(200).json({ message: '비밀번호가 확인되었습니다' });
  } catch (error) {
    console.error('비밀번호 확인 실패:', error);
    res.status(500).json({ message: '비밀번호 확인 중 오류가 발생했습니다.' });
  }
});

// 게시글 공감하기 (POST)
router.post('/posts/:postId/like', async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    post.likeCount += 1;
    await post.save();

    res.status(200).json({ message: '게시글 공감 성공' });
  } catch (error) {
    console.error('게시글 공감 실패:', error);
    res.status(500).json({ message: '게시글 공감 중 오류가 발생했습니다.' });
  }
});

// 게시글 공개 여부 확인 (GET)
router.get('/posts/:postId/is-public', async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      id: post._id,
      isPublic: post.isPublic
    });
  } catch (error) {
    console.error('게시글 공개 여부 확인 실패:', error);
    res.status(500).json({ message: '게시글 공개 여부 확인 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
