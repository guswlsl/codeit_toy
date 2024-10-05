const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const mongoose = require('mongoose'); 

// 댓글 등록 (POST)
router.post('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    const { nickname, content, password } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: '유효하지 않은 게시글 ID입니다.' });
        }

        const newComment = new Comment({
            postId: new mongoose.Types.ObjectId(postId), 
            nickname,
            content,
            password
        });

        const savedComment = await newComment.save();
        res.status(201).json({
            id: savedComment._id,
            nickname: savedComment.nickname,
            content: savedComment.content,
            createdAt: savedComment.createdAt
        });
    } catch (error) {
        console.error('댓글 등록 실패:', error);
        res.status(500).json({ message: '댓글 등록 중 오류가 발생했습니다.' });
    }
});

// 댓글 목록 조회 (GET)
router.get('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;

    try {
        const pageNumber = parseInt(page, 10);
        const pageLimit = parseInt(pageSize, 10);

        const totalComments = await Comment.countDocuments({ postId });
        const comments = await Comment.find({ postId })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            currentPage: pageNumber,
            totalPages: Math.ceil(totalComments / pageLimit),
            totalItemCount: totalComments,
            data: comments.map(comment => ({
                id: comment._id,
                nickname: comment.nickname,
                content: comment.content,
                createdAt: comment.createdAt
            }))
        });
    } catch (error) {
        console.error('댓글 목록 조회 실패:', error);
        res.status(500).json({ message: '댓글 목록 조회 중 오류가 발생했습니다.' });
    }
});

// 댓글 수정 (PUT)
router.put('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { nickname, content, password } = req.body;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (comment.password !== password) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        comment.nickname = nickname || comment.nickname;
        comment.content = content || comment.content;

        const updatedComment = await comment.save();
        res.status(200).json({
            id: updatedComment._id,
            nickname: updatedComment.nickname,
            content: updatedComment.content,
            createdAt: updatedComment.createdAt
        });
    } catch (error) {
        console.error('댓글 수정 실패:', error);
        res.status(500).json({ message: '댓글 수정 중 오류가 발생했습니다.' });
    }
});

// 댓글 삭제 (DELETE)
router.delete('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { password } = req.body;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (comment.password !== password) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        await comment.deleteOne();
        res.status(200).json({ message: '댓글 삭제 성공' });
    } catch (error) {
        console.error('댓글 삭제 실패:', error);
        res.status(500).json({ message: '댓글 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
