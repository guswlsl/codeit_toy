const express = require('express');
const router = express.Router();
const Group = require('../models/group'); 
const mongoose = require('mongoose'); 

// 그룹 목록 조회 (GET)
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(pageSize, 10);
    
    const searchQuery = keyword
      ? { $or: [{ name: new RegExp(keyword, 'i') }, { introduction: new RegExp(keyword, 'i') }] }
      : {};

    const visibilityFilter = isPublic !== undefined ? { isPublic: isPublic === 'true' } : {};

    let sortOption;
    switch (sortBy) {
      case 'mostPosted':
        sortOption = { postCount: -1 };
        break;
      case 'mostLiked':
        sortOption = { likeCount: -1 };
        break;
      case 'mostBadge':
        sortOption = { badges: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const totalItemCount = await Group.countDocuments({ ...searchQuery, ...visibilityFilter });

    const groups = await Group.find({ ...searchQuery, ...visibilityFilter })
      .sort(sortOption)
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit);

    const totalPages = Math.ceil(totalItemCount / pageLimit);

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalItemCount,
      data: groups.map(group => ({
        id: group._id,
        name: group.name,
        imageUrl: group.imageUrl,
        isPublic: group.isPublic,
        likeCount: group.likeCount,
        badgeCount: group.badges.length,
        postCount: group.postCount,
        createdAt: group.createdAt,
        introduction: group.introduction
      }))
    });
  } catch (error) {
    console.error('그룹 목록 조회 실패:', error);
    res.status(500).json({ message: '그룹 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 그룹 등록 (POST)
router.post('/', async (req, res) => {
  const { name, password, imageUrl, isPublic, introduction } = req.body;

  try {
    const newGroup = new Group({ name, password, imageUrl, isPublic, introduction });
    const savedGroup = await newGroup.save();

    res.status(201).json({
      id: savedGroup._id,
      name: savedGroup.name,
      imageUrl: savedGroup.imageUrl,
      isPublic: savedGroup.isPublic,
      likeCount: savedGroup.likeCount,
      badges: savedGroup.badges,
      postCount: savedGroup.postCount,
      createdAt: savedGroup.createdAt,
      introduction: savedGroup.introduction
    });
  } catch (error) {
    console.error('그룹 등록 실패:', error);
    res.status(500).json({ message: '그룹 등록 중 오류가 발생했습니다.' });
  }
});

// 그룹 수정 (PUT)
router.put('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { name, password, imageUrl, isPublic, introduction } = req.body;

  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: '유효하지 않은 그룹 ID입니다.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }

    group.name = name || group.name;
    group.password = password || group.password;
    group.imageUrl = imageUrl || group.imageUrl;
    group.isPublic = isPublic !== undefined ? isPublic : group.isPublic;
    group.introduction = introduction || group.introduction;

    const updatedGroup = await group.save();

    res.status(200).json({
      id: updatedGroup._id,
      name: updatedGroup.name,
      imageUrl: updatedGroup.imageUrl,
      isPublic: updatedGroup.isPublic,
      likeCount: updatedGroup.likeCount,
      badges: updatedGroup.badges,
      postCount: updatedGroup.postCount,
      createdAt: updatedGroup.createdAt,
      introduction: updatedGroup.introduction
    });
  } catch (error) {
    console.error('그룹 수정 실패:', error);
    res.status(500).json({ message: '그룹 수정 중 오류가 발생했습니다.' });
  }
});

// 그룹 삭제 (DELETE)
router.delete('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: '비밀번호가 필요합니다.' });
  }

  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: '유효하지 않은 그룹 ID입니다.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }

    if (group.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    await group.deleteOne();

    res.status(200).json({ message: '그룹이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('그룹 삭제 실패:', error);
    res.status(500).json({ message: '그룹 삭제 중 오류가 발생했습니다.' });
  }
});

// 그룹 상세 정보 조회 (GET)
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: '유효하지 않은 그룹 ID입니다.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }

    res.status(200).json({
      id: group._id,
      name: group.name,
      imageUrl: group.imageUrl,
      isPublic: group.isPublic,
      likeCount: group.likeCount,
      badges: group.badges,
      postCount: group.postCount,
      createdAt: group.createdAt,
      introduction: group.introduction
    });
  } catch (error) {
    console.error('그룹 조회 실패:', error);
    res.status(500).json({ message: '그룹 조회 중 오류가 발생했습니다.' });
  }
});

// 그룹 조회 권한 확인 (POST)
router.post('/:groupId/verify-password', async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }

    if (group.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    res.status(200).json({ message: '비밀번호가 일치합니다.' });
  } catch (error) {
    console.error('비밀번호 확인 실패:', error);
    res.status(500).json({ message: '비밀번호 확인 중 오류가 발생했습니다.' });
  }
});

// 그룹 공감하기 (POST)
router.post('/:groupId/like', async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }

    group.likeCount += 1;
    await group.save();

    res.status(200).json({ message: '그룹에 공감했습니다.' });
  } catch (error) {
    console.error('그룹 공감 실패:', error);
    res.status(500).json({ message: '그룹 공감 중 오류가 발생했습니다.' });
  }
});

// 그룹 공개 여부 확인 (GET)
router.get('/:groupId/is-public', async (req, res) => {
    const { groupId } = req.params;
  
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
      }
      
      res.status(200).json({
        id: group._id,
        isPublic: group.isPublic
      });
    } catch (error) {
      console.error('그룹 공개 여부 확인 실패:', error);
      res.status(500).json({ message: '그룹 공개 여부 확인 중 오류가 발생했습니다.' });
    }
  });
  

module.exports = router;
